'use client';

import React, { useEffect, useState } from 'react';

type IncomingCall = {
  callerId: string;
  callerName: string;
  roomId: string;
};

export default function IncomingCallPopup({
  call,
  onAccept,
  onReject,
}: {
  call: IncomingCall;
  onAccept: (roomId: string, callerId: string) => void;
  onReject: (callerId: string) => void;
}) {
  const [ringing, setRinging] = useState(true);

  // Auto-reject after 30s
  useEffect(() => {
    const timer = setTimeout(() => {
      onReject(call.callerId);
    }, 30000);
    return () => clearTimeout(timer);
  }, [call, onReject]);

  const getColor = (name: string) => {
    const colors = ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];
    let hash = 0;
    for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-8 pointer-events-none">
      <div className="pointer-events-auto animate-in slide-in-from-top-4 duration-300">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 w-80 overflow-hidden">
          {/* Pulsing top bar */}
          <div className="h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 animate-pulse"></div>

          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-black text-white"
                  style={{ backgroundColor: getColor(call.callerName) }}
                >
                  {getInitials(call.callerName)}
                </div>
                {/* Ringing rings */}
                <div className="absolute -inset-1 rounded-3xl border-2 border-rose-500/30 animate-ping"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Incoming Video Call</p>
                <p className="text-base font-bold text-white truncate">{call.callerName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-[10px] text-zinc-500">Ringing…</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onReject(call.callerId)}
                className="flex-1 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-red-950/40 hover:border-red-900/50 hover:text-red-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
                Decline
              </button>
              <button
                onClick={() => onAccept(call.roomId, call.callerId)}
                className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
