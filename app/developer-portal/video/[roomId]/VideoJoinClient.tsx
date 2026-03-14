'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import VideoCallModal from '../../chat/VideoCallModal';
import Link from 'next/link';

export default function VideoJoinClient({
  token,
  developer,
  roomId,
}: {
  token: string;
  developer: { id: string; name: string; email: string };
  roomId: string;
}) {
  const [joined, setJoined] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4001';
    const s = io(CHAT_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => { s.disconnect(); };
  }, [token]);

  if (joined && socket) {
    return (
      <VideoCallModal
        socket={socket}
        roomId={roomId}
        developer={developer}
        onClose={() => setJoined(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white mb-2 tracking-tight">Join Dev Call</h1>
        <p className="text-sm text-zinc-500 mb-1">You've been invited to a video call</p>
        <p className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-3 py-1.5 rounded-lg mb-6 truncate">Room: {roomId.slice(0, 20)}…</p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></div>
            <span className="text-xs text-zinc-400 font-medium">
              {connected ? `Joining as ${developer.name}` : 'Connecting...'}
            </span>
          </div>

          <button
            onClick={() => setJoined(true)}
            disabled={!connected}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            Join Video Call
          </button>

          <Link
            href="/developer-portal/chat"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
          >
            ← Back to Dev Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
