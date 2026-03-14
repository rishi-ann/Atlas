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

type OnlineUser = {
  id: string;
  name: string;
};

export default function DevChatClient({ token, developer }: { token: string; developer: { id: string; name: string; email: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<OnlineUser[]>([]);
  const [systemMessages, setSystemMessages] = useState<string[]>([]);
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
    });

    socket.on('receive_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('online_users', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    socket.on('developer_joined', (user: OnlineUser) => {
      setSystemMessages(prev => [...prev, `${user.name} joined the channel`]);
    });

    socket.on('developer_left', (user: OnlineUser) => {
      setSystemMessages(prev => [...prev, `${user.name} left the channel`]);
    });

    socket.on('developer_typing', (user: OnlineUser) => {
      setTypingUsers(prev => {
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    socket.on('developer_stop_typing', (user: { id: string }) => {
      setTypingUsers(prev => prev.filter(u => u.id !== user.id));
    });

    return () => {
      socket.disconnect();
    };
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

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const colorForName = (name: string) => {
    const colors = ['bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-cyan-500'];
    let hash = 0;
    for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] m-4 gap-4">
      {/* Sidebar: Online Users */}
      <div className="w-64 shrink-0 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-900">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Online Now</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></div>
            <span className="text-[11px] font-semibold text-zinc-400">{connected ? 'Connected to Atlas Chat' : 'Connecting...'}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {onlineUsers.length === 0 ? (
            <p className="text-[11px] text-zinc-600 italic px-1 mt-4">No developers online yet.</p>
          ) : (
            onlineUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-900/60 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${colorForName(user.name)}`}>
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200 leading-tight">{user.name}</p>
                  {user.id === developer.id && <p className="text-[9px] text-emerald-500 font-bold">You</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              #atlas-dev-lounge
            </h2>
            <p className="text-[10px] text-zinc-500">Internal developer broadcast channel</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-zinc-400">{onlineUsers.length} online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {messages.length === 0 && systemMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
              <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="text-xs text-zinc-600 font-medium">No messages yet. Say hi to your team!</p>
            </div>
          )}

          {/* System messages woven into the timeline */}
          {systemMessages.map((msg, i) => (
            <div key={`sys-${i}`} className="flex items-center justify-center gap-3 py-2">
              <div className="h-px flex-1 bg-zinc-900"></div>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{msg}</span>
              <div className="h-px flex-1 bg-zinc-900"></div>
            </div>
          ))}

          {messages.map((msg, i) => {
            const isOwn = msg.senderId === developer.id;
            const showHeader = i === 0 || messages[i - 1].senderId !== msg.senderId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4' : 'mt-1'}`}>
                {showHeader && (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 self-end ${colorForName(msg.senderName)}`}>
                    {getInitials(msg.senderName)}
                  </div>
                )}
                {!showHeader && <div className="w-8 shrink-0"></div>}
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {showHeader && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] font-bold text-zinc-300">{isOwn ? 'You' : msg.senderName}</span>
                      <span className="text-[9px] text-zinc-600">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-rose-500/90 text-white rounded-br-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
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
        <div className="px-6 pb-6 pt-3">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-700 transition-colors">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #atlas-dev-lounge`}
              disabled={!connected}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="w-8 h-8 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
          <p className="text-[9px] text-zinc-700 mt-2 text-center">
            Atlas Secure Channel · Messages are ephemeral and not stored
          </p>
        </div>
      </div>
    </div>
  );
}
