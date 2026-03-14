'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

type Peer = {
  id: string;
  name: string;
  socketId: string;
  stream?: MediaStream;
  conn?: RTCPeerConnection;
};

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function VideoCallModal({
  socket,
  roomId,
  developer,
  onClose,
}: {
  socket: Socket;
  roomId: string;
  developer: { id: string; name: string };
  onClose: () => void;
}) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConns = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const getColor = (name: string) => {
    const colors = ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];
    let hash = 0;
    for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const createPeerConnection = useCallback((targetSocketId: string, targetId: string, targetName: string) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConns.current.set(targetSocketId, pc);

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('webrtc_ice', { targetSocketId, candidate: e.candidate });
      }
    };

    // Remote stream
    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      setPeers(prev => prev.map(p =>
        p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p
      ));
    };

    return pc;
  }, [socket]);

  useEffect(() => {
    let stream: MediaStream;

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Generate invite link
        const base = window.location.origin;
        setInviteLink(`${base}/developer-portal/video/${roomId}`);

        // Join the room
        socket.emit('join_room', { roomId });
      } catch (err) {
        console.error('Media error:', err);
      }
    };

    init();

    // ── Socket Listeners ──────────────────────────────────────

    // Someone new joined — we make the offer
    socket.on('peer_joined', async ({ peerId, peerName, peerSocketId }: any) => {
      setPeers(prev => [...prev, { id: peerId, name: peerName, socketId: peerSocketId }]);
      const pc = createPeerConnection(peerSocketId, peerId, peerName);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { targetSocketId: peerSocketId, offer, roomId });
    });

    // We receive existing peers — we wait for their offers
    socket.on('existing_peers', (existingPeers: any[]) => {
      existingPeers.forEach(peer => {
        setPeers(prev => {
          if (prev.find(p => p.socketId === peer.socketId)) return prev;
          return [...prev, { id: peer.id, name: peer.name, socketId: peer.socketId }];
        });
        createPeerConnection(peer.socketId, peer.id, peer.name);
      });
    });

    // Receive offer → create answer
    socket.on('webrtc_offer', async ({ offer, fromSocketId, fromId, fromName }: any) => {
      let pc = peerConns.current.get(fromSocketId);
      if (!pc) {
        setPeers(prev => {
          if (prev.find(p => p.socketId === fromSocketId)) return prev;
          return [...prev, { id: fromId, name: fromName, socketId: fromSocketId }];
        });
        pc = createPeerConnection(fromSocketId, fromId, fromName);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { targetSocketId: fromSocketId, answer });
    });

    // Receive answer
    socket.on('webrtc_answer', async ({ answer, fromSocketId }: any) => {
      const pc = peerConns.current.get(fromSocketId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Receive ICE candidate
    socket.on('webrtc_ice', async ({ candidate, fromSocketId }: any) => {
      const pc = peerConns.current.get(fromSocketId);
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    });

    // Someone left
    socket.on('call_ended', ({ endedBy }: any) => {
      setCallEnded(true);
      setTimeout(handleEndCall, 2500);
    });

    return () => {
      socket.off('peer_joined');
      socket.off('existing_peers');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice');
      socket.off('call_ended');
    };
  }, [socket, roomId, createPeerConnection]);

  const handleEndCall = () => {
    socket.emit('end_call', { roomId });
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConns.current.forEach(pc => pc.close());
    peerConns.current.clear();
    onClose();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(c => !c);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allParticipants = [{ id: developer.id, name: developer.name, stream: localStream, socketId: 'self' }, ...peers];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-sm font-semibold text-white">Atlas Dev Call</span>
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded">{roomId.slice(0, 12)}…</span>
        </div>
        {/* Invite Link */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            <span className="text-[10px] text-zinc-400 max-w-[180px] truncate font-mono">{inviteLink}</span>
          </div>
          <button
            onClick={copyInvite}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all border ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
          >
            {copied ? '✓ Copied!' : 'Copy Invite'}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-auto">
        {callEnded ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
            <svg className="w-12 h-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
            <p className="text-sm font-semibold text-zinc-400">Call ended</p>
          </div>
        ) : (
          <div className={`grid gap-3 h-full ${
            allParticipants.length === 1 ? 'grid-cols-1' :
            allParticipants.length === 2 ? 'grid-cols-2' :
            allParticipants.length <= 4 ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {allParticipants.map((p, idx) => (
              <VideoTile
                key={p.socketId}
                participant={p}
                isSelf={p.socketId === 'self'}
                isCamOff={p.socketId === 'self' && isCamOff}
                getColor={getColor}
                getInitials={getInitials}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="py-5 border-t border-zinc-900 flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          )}
        </button>

        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isCamOff ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'}`}
          title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCamOff ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 border border-red-400/30 flex items-center justify-center transition-all shadow-lg shadow-red-500/20"
          title="End Call"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function VideoTile({ participant, isSelf, isCamOff, getColor, getInitials }: {
  participant: any;
  isSelf: boolean;
  isCamOff: boolean;
  getColor: (n: string) => string;
  getInitials: (n: string) => string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div className="relative bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-800 min-h-[200px]">
      {(!participant.stream || isCamOff) ? (
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black text-white"
            style={{ backgroundColor: getColor(participant.name) }}
          >
            {getInitials(participant.name)}
          </div>
          <span className="text-xs text-zinc-400 font-semibold">{isSelf ? 'You' : participant.name}</span>
          {isCamOff && <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Camera off</span>}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
        <span className="text-[10px] font-bold text-white">{isSelf ? 'You' : participant.name}</span>
      </div>
    </div>
  );
}
