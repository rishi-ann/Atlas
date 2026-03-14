'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
};

// From DB: every approved developer
type PortalDev = {
  id: string;
  name: string;
  email: string;
  isPortalActive: boolean; // active in portal in last 15 mins
};

// From Socket.io: devs who have the chat page open RIGHT NOW
type SocketUser = {
  id: string;
  name: string;
};

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
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4001';

    const socket = io(CHAT_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setChatOnlineIds(new Set());
    });

    socket.on('receive_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    // Sync who's actually in the chat room
    socket.on('online_users', (users: SocketUser[]) => {
      setChatOnlineIds(new Set(users.map(u => u.id)));
    });

    socket.on('developer_typing', (user: SocketUser) => {
      setTypingUsers(prev => prev.find(u => u.id === user.id) ? prev : [...prev, user]);
    });

    socket.on('developer_stop_typing', (user: { id: string }) => {
      setTypingUsers(prev => prev.filter(u => u.id !== user.id));
    });

    return () => { socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { text: input.trim() });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('stop_typing');
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') return sendMessage();
    socketRef.current?.emit('typing');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing');
    }, 2000);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const colorForName = (name: string) => {
    const colors = ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];
    let hash = 0;
    for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Sort: self first, then chat-online, then portal-active, then offline
  const sortedDevs = [...allDevelopers].sort((a, b) => {
    if (a.id === developer.id) return -1;
    if (b.id === developer.id) return 1;
    const aChat = chatOnlineIds.has(a.id);
    const bChat = chatOnlineIds.has(b.id);
    if (aChat && !bChat) return -1;
    if (!aChat && bChat) return 1;
    if (a.isPortalActive && !b.isPortalActive) return -1;
    if (!a.isPortalActive && b.isPortalActive) return 1;
    return a.name.localeCompare(b.name);
  });

  const portalActiveCount = allDevelopers.filter(d => d.isPortalActive).length;

  return (
    <div className="flex h-[calc(100vh-2rem)] m-4 gap-4">

      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-900">
          <h3 className="text-xs font-bold text-zinc-400 mb-3 tracking-tight">Team Directory</h3>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-zinc-400">In Chat</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-500">{chatOnlineIds.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-[10px] font-semibold text-zinc-400">In Portal</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-500">{portalActiveCount}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sortedDevs.map(dev => {
            const inChat = chatOnlineIds.has(dev.id);
            const isSelf = dev.id === developer.id;
            const dotColor = inChat
              ? 'bg-emerald-500 animate-pulse'
              : dev.isPortalActive
              ? 'bg-amber-500'
              : 'bg-zinc-700';
            const statusLabel = isSelf ? 'You' : inChat ? 'In Chat' : dev.isPortalActive ? 'Active' : 'Offline';

            return (
              <div key={dev.id} className={`flex items-center gap-3 mx-2 px-2 py-2 rounded-xl ${isSelf ? 'bg-zinc-900/70' : 'hover:bg-zinc-900/40'} transition-colors`}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
                  style={{ backgroundColor: colorForName(dev.name) }}
                >
                  {getInitials(dev.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 leading-tight truncate">{dev.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}></span>
                    <span className={`text-[9px] font-bold ${inChat ? 'text-emerald-500' : dev.isPortalActive ? 'text-amber-500' : 'text-zinc-600'}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Connection status */}
        <div className={`px-4 py-2.5 border-t border-zinc-900 flex items-center gap-2 ${connected ? '' : 'opacity-60'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            {connected ? 'Chat Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              #atlas-dev-lounge
            </h2>
            <p className="text-[10px] text-zinc-500">Internal developer broadcast channel · {allDevelopers.length} members</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-zinc-400">{chatOnlineIds.size} in chat</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
              <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xs text-zinc-600 font-medium">No messages yet. Say hi to the team!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.senderId === developer.id;
            const showHeader = i === 0 || messages[i - 1].senderId !== msg.senderId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
                {showHeader ? (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 self-end"
                    style={{ backgroundColor: colorForName(msg.senderName) }}
                  >
                    {getInitials(msg.senderName)}
                  </div>
                ) : (
                  <div className="w-8 shrink-0" />
                )}
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[68%]`}>
                  {showHeader && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] font-bold text-zinc-300">{isOwn ? 'You' : msg.senderName}</span>
                      <span className="text-[9px] text-zinc-600">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-rose-500 text-white rounded-br-sm'
                      : 'bg-zinc-900 border border-zinc-800/80 text-zinc-100 rounded-bl-sm'
                  }`}>
                    {msg.text}
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
              <span className="text-[10px] text-zinc-500">
                {typingUsers.filter(u => u.id !== developer.id).map(u => u.name).join(', ')} typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 pb-5 pt-3">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-700 transition-colors">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? `Message #atlas-dev-lounge...` : 'Connecting to chat server...'}
              disabled={!connected}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none disabled:opacity-40"
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="w-8 h-8 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
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
  );
}
