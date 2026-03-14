'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import VideoCallModal from './VideoCallModal';
import IncomingCallPopup from './IncomingCallPopup';

type Message = { 
  id: string; 
  senderId: string; 
  senderName: string; 
  text: string; 
  timestamp: string; 
  channel?: string; 
  receiverId?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
};
type PortalDev = { id: string; name: string; email: string; isPortalActive: boolean; };
type SocketUser = { id: string; name: string; };
type IncomingCall = { callerId: string; callerName: string; roomId: string; };

export default function DevChatClient({
  token,
  developer,
  allDevelopers,
}: {
  token: string;
  developer: { id: string; name: string; email: string };
  allDevelopers: PortalDev[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatOnlineIds, setChatOnlineIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<SocketUser[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, { text: string; timestamp: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Call state
  const [inCall, setInCall] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callToast, setCallToast] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load chat history from DB on mount
  useEffect(() => {
    if (!mounted) return;
    fetch(`/api/chat/messages?limit=100&userId=${developer.id}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const historical: Message[] = data.map(m => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName,
            text: m.content,
            channel: m.channel,
            receiverId: m.receiverId,
            fileUrl: m.fileUrl,
            fileType: m.fileType,
            fileName: m.fileName,
            timestamp: m.createdAt,
          }));
          setMessages(historical);
          
          // Calculate initial last messages
          const lasts: Record<string, { text: string; timestamp: string }> = {};
          historical.forEach(m => {
            const key = m.channel === 'direct' 
              ? (m.senderId === developer.id ? m.receiverId! : m.senderId)
              : m.channel || 'all';
            
            if (!lasts[key] || new Date(m.timestamp) > new Date(lasts[key].timestamp)) {
              lasts[key] = { 
                text: m.text || (m.fileUrl ? (m.fileType === 'image' ? '📷 Image' : m.fileType === 'video' ? '🎥 Video' : '📄 File') : ''), 
                timestamp: m.timestamp 
              };
            }
          });
          setLastMessages(lasts);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [developer.id]);

  useEffect(() => {
    const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4001';
    let socket: Socket;
    try {
      socket = io(CHAT_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 5, timeout: 5000 });
      socketRef.current = socket;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => { setConnected(false); setChatOnlineIds(new Set()); });
      socket.on('connect_error', () => { setConnected(false); });
      socket.on('receive_message', (msg: Message) => {
        setMessages(prev => [...prev, msg]);
        
        const channelKey = msg.channel === 'direct' 
          ? (msg.senderId === developer.id ? msg.receiverId! : msg.senderId)
          : msg.channel || 'all';

        setLastMessages(prev => ({
          ...prev,
          [channelKey]: { 
            text: msg.text || (msg.fileUrl ? (msg.fileType === 'image' ? '📷 Image' : msg.fileType === 'video' ? '🎥 Video' : '📄 File') : ''), 
            timestamp: msg.timestamp 
          }
        }));

        if (msg.senderId !== developer.id) {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(msg.senderName, {
              body: msg.text || 'Sent an attachment',
              icon: 'https://ik.imagekit.io/dypkhqxip/logo_atlas.png'
            });
          }
          
          if ((msg.channel === 'direct' && channelKey !== activeChannel) || (msg.channel !== 'direct' && msg.channel !== activeChannel)) {
            setUnreadCounts(prev => ({
              ...prev,
              [channelKey]: (prev[channelKey] || 0) + 1
            }));
          }
        }
      });
      socket.on('online_users', (users: SocketUser[]) => setChatOnlineIds(new Set(users.map(u => u.id))));
      socket.on('developer_typing', (user: SocketUser) => setTypingUsers(prev => prev.find(u => u.id === user.id) ? prev : [...prev, user]));
      socket.on('developer_stop_typing', (user: { id: string }) => setTypingUsers(prev => prev.filter(u => u.id !== user.id)));

      socket.on('incoming_call', (data: IncomingCall) => { 
        setIncomingCall(data);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Incoming Video Call', { body: `${data.callerName} is calling you.` });
        }
      });
      socket.on('call_accepted_ack', ({ roomId }: any) => { setActiveRoomId(roomId); setInCall(true); });
      socket.on('call_rejected_ack', ({ rejectorName }: any) => {
        setCallToast(`${rejectorName} declined the call.`);
        setTimeout(() => setCallToast(null), 3500);
      });
      socket.on('call_failed', ({ reason }: any) => {
        setCallToast(reason);
        setTimeout(() => setCallToast(null), 3500);
      });

      socket.on('task_notification', (data: any) => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Task Update', { 
            body: `${data.senderName} updated task: ${data.title}`,
            icon: 'https://ik.imagekit.io/dypkhqxip/logo_atlas.png'
          });
        }
      });

      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => { socket.disconnect(); };
    } catch (err) {
      console.error('Chat connection error:', err);
      setConnected(false);
      return () => {};
    }
  }, [token, activeChannel, developer.id]);

  useEffect(() => {
    // Clear unread count when switching to a channel
    if (activeChannel) {
      setUnreadCounts(prev => {
        if (!prev[activeChannel]) return prev;
        const next = { ...prev };
        delete next[activeChannel];
        return next;
      });
    }
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    
    const isDirect = activeChannel !== 'all' && activeChannel !== 'admin';
    
    socketRef.current.emit('send_message', { 
      text: input.trim(),
      channel: isDirect ? 'direct' : activeChannel,
      receiverId: isDirect ? activeChannel : null,
      fileUrl: null,
      fileType: null,
      fileName: null,
    });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('stop_typing');
    setInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socketRef.current) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        const isDirect = activeChannel !== 'all' && activeChannel !== 'admin';
        socketRef.current.emit('send_message', {
          text: '',
          channel: isDirect ? 'direct' : activeChannel,
          receiverId: isDirect ? activeChannel : null,
          fileUrl: data.url,
          fileType: data.fileType,
          fileName: data.fileName,
        });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setCallToast('File upload failed.');
      setTimeout(() => setCallToast(null), 3000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') return sendMessage();
    socketRef.current?.emit('typing');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { socketRef.current?.emit('stop_typing'); }, 2000);
  };

  const startCall = (targetId: string) => {
    if (!connected) { setCallToast('Not connected to chat server.'); setTimeout(() => setCallToast(null), 3000); return; }
    if (targetId === developer.id) return;
    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    socketRef.current?.emit('call_request', { targetId, roomId });
    setActiveRoomId(roomId);
    setInCall(true);
  };

  const acceptCall = (roomId: string, callerId: string) => {
    socketRef.current?.emit('call_accepted', { roomId, callerId });
    setIncomingCall(null);
    setActiveRoomId(roomId);
    setInCall(true);
  };

  const rejectCall = (callerId: string) => {
    socketRef.current?.emit('call_rejected', { callerId });
    setIncomingCall(null);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const colorForName = (name: string) => {
    const colors = ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];
    let hash = 0;
    for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sortedDevs = [...allDevelopers].sort((a, b) => {
    if (a.id === developer.id) return -1;
    if (b.id === developer.id) return 1;
    const aChat = chatOnlineIds.has(a.id), bChat = chatOnlineIds.has(b.id);
    if (aChat && !bChat) return -1; if (!aChat && bChat) return 1;
    if (a.isPortalActive && !b.isPortalActive) return -1; if (!a.isPortalActive && b.isPortalActive) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredMessages = messages.filter(msg => {
    if (activeChannel === 'all') return msg.channel === 'all' || !msg.channel;
    if (activeChannel === 'admin') return msg.channel === 'admin';
    return msg.channel === 'direct' && ((msg.senderId === activeChannel && msg.receiverId === developer.id) || (msg.senderId === developer.id && msg.receiverId === activeChannel));
  });

  const getChannelName = () => {
    if (activeChannel === 'all') return '#atlas-dev-lounge';
    if (activeChannel === 'admin') return '#admin-announcements';
    return `#dm-${allDevelopers.find(d => d.id === activeChannel)?.name || 'Unknown'}`;
  };

  if (!mounted) return null;

  return (
    <>
      {/* Incoming call popup */}
      {incomingCall && (
        <IncomingCallPopup call={incomingCall} onAccept={acceptCall} onReject={rejectCall} />
      )}

      {/* Active video call */}
      {inCall && activeRoomId && socketRef.current && (
        <VideoCallModal
          socket={socketRef.current}
          roomId={activeRoomId}
          developer={developer}
          onClose={() => { setInCall(false); setActiveRoomId(null); }}
        />
      )}

      {/* Toast notification */}
      {callToast && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl text-sm text-zinc-300 font-medium animate-in slide-in-from-top-2">
          {callToast}
        </div>
      )}

      <div className="flex h-[calc(100vh-2rem)] m-4 gap-4">
        {/* Sidebar */}
        <div className="w-64 shrink-0 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-900">
            <h3 className="text-xs font-bold text-zinc-400 mb-3 tracking-tight">Channels</h3>
            <div className="flex flex-col gap-1.5 mb-4">
                <button 
                  onClick={() => setActiveChannel('all')} 
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors group ${activeChannel === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900'}`}
                >
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-xs font-semibold"># atlas-dev-lounge</span>
                    {lastMessages['all'] && (
                      <span className="text-[10px] text-zinc-500 truncate w-full">{lastMessages['all'].text}</span>
                    )}
                  </div>
                  {unreadCounts['all'] > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-[9px] font-black text-white shrink-0">
                      {unreadCounts['all']}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveChannel('admin')} 
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors group ${activeChannel === 'admin' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900'}`}
                >
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-xs font-semibold"># admin-announcements</span>
                    {lastMessages['admin'] && (
                      <span className="text-[10px] text-zinc-500 truncate w-full">{lastMessages['admin'].text}</span>
                    )}
                  </div>
                  {unreadCounts['admin'] > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-[9px] font-black text-white shrink-0">
                      {unreadCounts['admin']}
                    </span>
                  )}
                </button>
              </div>
              <h3 className="text-xs font-bold text-zinc-400 mb-3 tracking-tight">Direct Messages</h3>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-semibold text-zinc-400">In Chat</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500">{chatOnlineIds.size}</span>
                </div>
              </div>
            </div>
  
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {sortedDevs.map(dev => {
                const inChat = chatOnlineIds.has(dev.id);
                const isSelf = dev.id === developer.id;
                const dotColor = inChat ? 'bg-emerald-500 animate-pulse' : dev.isPortalActive ? 'bg-amber-500' : 'bg-zinc-700';
                const statusLabel = isSelf ? 'You' : inChat ? 'In Chat' : dev.isPortalActive ? 'Active' : 'Offline';
  
                return (
                  <div 
                    key={dev.id} 
                    onClick={() => !isSelf && setActiveChannel(dev.id)}
                    className={`group flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${isSelf ? 'opacity-50 cursor-default' : 'cursor-pointer'} ${activeChannel === dev.id ? 'bg-zinc-800' : 'hover:bg-zinc-900/60'}`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{ backgroundColor: colorForName(dev.name) }}>
                      {getInitials(dev.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold leading-tight truncate ${activeChannel === dev.id ? 'text-white' : 'text-zinc-200'}`}>{dev.name}</p>
                        {unreadCounts[dev.id] > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[9px] font-black text-white shrink-0">
                            {unreadCounts[dev.id]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span className={`w-1 h-1 rounded-full ${dotColor} shrink-0`}></span>
                          <span className="text-[10px] text-zinc-500 truncate min-w-0">
                            {lastMessages[dev.id] ? lastMessages[dev.id].text : statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                  {/* Video Call Button — visible on hover, hidden for self */}
                  {!isSelf && (
                    <button
                      onClick={() => startCall(dev.id)}
                      title={`Video call ${dev.name}`}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-zinc-800 hover:bg-rose-500/20 hover:border-rose-500/30 border border-transparent text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-all shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`px-4 py-2.5 border-t border-zinc-900 flex items-center gap-2 ${connected ? '' : 'opacity-60'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              {connected ? 'Chat Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                {getChannelName()}
              </h2>
              <p className="text-[10px] text-zinc-500">
                {activeChannel === 'all' && `Hover a developer → click 📹 to call · ${allDevelopers.length} members`}
                {activeChannel === 'admin' && `System announcements and updates from Server Admin.`}
                {activeChannel !== 'all' && activeChannel !== 'admin' && `Direct message with ${allDevelopers.find(d => d.id === activeChannel)?.name}`}
              </p>
            </div>
            {activeChannel === 'all' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-zinc-400">{chatOnlineIds.size} in chat</span>
              </div>
            )}
            {activeChannel !== 'all' && activeChannel !== 'admin' && (
              <button onClick={() => startCall(activeChannel)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span className="text-[10px] font-bold">Start Call</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
            {filteredMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-xs text-zinc-600 font-medium">No messages yet. Send a message to start the conversation!</p>
              </div>
            )}
            {filteredMessages.map((msg, i) => {
              const isOwn = msg.senderId === developer.id;
              const showHeader = i === 0 || filteredMessages[i - 1].senderId !== msg.senderId;
              return (
                <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
                  {showHeader ? (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 self-end" style={{ backgroundColor: colorForName(msg.senderName) }}>
                      {getInitials(msg.senderName)}
                    </div>
                  ) : <div className="w-8 shrink-0" />}
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[68%]`}>
                    {showHeader && (
                      <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[11px] font-bold text-zinc-300">{isOwn ? 'You' : msg.senderName}</span>
                        <span className="text-[9px] text-zinc-600">{formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${isOwn ? 'bg-rose-500 text-white rounded-br-sm' : 'bg-zinc-900 border border-zinc-800/80 text-zinc-100 rounded-bl-sm'} ${msg.text?.includes(`@${developer.name.split(' ')[0]}`) ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                      {msg.text && (
                        <div>
                          {msg.text.split(/(@\w+)/g).map((part, idx) => 
                            part.startsWith('@') ? <span key={idx} className="font-bold text-white bg-white/10 px-1 rounded">{part}</span> : part
                          )}
                        </div>
                      )}
                      {msg.fileUrl && (
                        <div className={msg.text ? 'mt-3' : ''}>
                          {msg.fileType === 'image' && (
                            <img src={msg.fileUrl} alt={msg.fileName || 'Attachment'} className="max-w-full rounded-lg border border-black/20" />
                          )}
                          {msg.fileType === 'video' && (
                            <video src={msg.fileUrl} controls className="max-w-full rounded-lg border border-black/20" />
                          )}
                          {msg.fileType === 'document' && (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span className="text-xs font-medium truncate max-w-[150px]">{msg.fileName || 'Document'}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {typingUsers.filter(u => u.id !== developer.id).length > 0 && (
              <div className="flex items-center gap-2 mt-3 pl-11">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]"></span>
                </div>
                <span className="text-[10px] text-zinc-500">{typingUsers.filter(u => u.id !== developer.id).map(u => u.name).join(', ')} typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-6 pb-5 pt-3">
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-700 transition-colors">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={!connected || uploading || activeChannel === 'admin'}
                className="text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                )}
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={connected ? `Message ${getChannelName()}...` : 'Connecting to chat server...'}
                disabled={!connected || activeChannel === 'admin'}
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none disabled:opacity-40"
              />
              <button
                onClick={sendMessage}
                disabled={!connected || !input.trim()}
                className="w-8 h-8 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            {!connected && (
              <p className="text-[9px] text-amber-500/70 mt-2 text-center font-semibold">
                ⚠ Chat server offline. Run: <code className="font-mono">npm run chat:dev</code> in a separate terminal.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
