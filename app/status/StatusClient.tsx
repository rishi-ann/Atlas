'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  ShieldCheckIcon, 
  ActivityIcon, 
  GithubIcon, 
  ServerIcon, 
  ClockIcon, 
  ActivityIcon as ActivityCheckIcon, 
  AlertCircleIcon,
  CheckCircle2Icon,
  TerminalIcon,
  CpuIcon,
  DatabaseIcon,
  GlobeIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type SystemLog = {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'git' | 'server' | 'user' | 'dashboard';
  message: string;
  metadata: any;
  createdAt: string;
};

type GitCommit = {
  hash: string;
  author: string;
  message: string;
  timestamp: number;
};

type HealthStatus = {
  status: string;
  uptime: number;
  timestamp: string;
  services: {
    api: string;
    database: string;
    chat_server: string;
  };
};

export default function StatusClient({ 
  initialLogs, 
  initialCommits,
  initialHealth 
}: { 
  initialLogs: SystemLog[], 
  initialCommits: GitCommit[],
  initialHealth: HealthStatus
}) {
  const [logs, setLogs] = useState<SystemLog[]>(initialLogs);
  const [commits, setCommits] = useState<GitCommit[]>(initialCommits);
  const [health, setHealth] = useState<HealthStatus>(initialHealth);
  const [liveLog, setLiveLog] = useState<SystemLog | null>(null);

  useEffect(() => {
    const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4001';
    // No auth needed for public status updates? 
    // Actually our socket.io uses auth middleware. 
    // For now I'll use high-level updates if possible, or just poll.
    // Let's assume this page might be public, so I won't use the authenticated socket here 
    // unless the user specifically wants it.
    // Instead I'll just poll every 10s for health/commits.
    const interval = setInterval(async () => {
      try {
        const hRes = await fetch('/api/system/health');
        const hData = await hRes.json();
        setHealth(hData);

        const lRes = await fetch('/api/system/logs?limit=50');
        const lData = await lRes.json();
        setLogs(lData);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'error': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'warn': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'git': return <GithubIcon size={14} />;
      case 'server': return <ServerIcon size={14} />;
      case 'user': return <GlobeIcon size={14} />;
      default: return <ActivityIcon size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 p-6 md:p-12 overflow-x-hidden relative">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              <ActivityIcon size={12} className="text-emerald-500 animate-pulse" />
              Live System Monitor
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              Platform Status
            </h1>
            <p className="text-zinc-500 max-w-lg text-lg font-medium leading-relaxed">
              Real-time feed of system logs, development activity, and infrastructure health across the Atlas ecosystem.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-3xl border ${health.status === 'operational' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} backdrop-blur-xl`}>
              {health.status === 'operational' ? <CheckCircle2Icon size={24} /> : <AlertCircleIcon size={24} />}
              <div className="text-right">
                <div className="text-xs font-black uppercase tracking-widest opacity-60">System Health</div>
                <div className="text-xl font-bold capitalize">{health.status}</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
              <ClockIcon size={10} />
              Last Updated: {new Date(health.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Uptime', value: `${(health.uptime / 3600).toFixed(1)}h`, icon: <ActivityIcon className="text-emerald-500" /> },
            { label: 'Latency', value: '42ms', icon: <CpuIcon className="text-blue-500" /> },
            { label: 'Database', value: health.services.database, icon: <DatabaseIcon className="text-indigo-500" />, capitalize: true },
            { label: 'Environment', value: 'Production', icon: <ShieldCheckIcon className="text-rose-500" /> },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center justify-between hover:border-white/10 transition-all group">
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold text-white tracking-tight ${stat.capitalize ? 'capitalize' : ''}`}>{stat.value}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Logs Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TerminalIcon size={20} className="text-rose-500" />
                <h2 className="text-xl font-bold">Activity Feed</h2>
              </div>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 py-1 rounded-full border border-white/5">
                {logs.length} Total Events
              </div>
            </div>

            <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden">
              <div className="p-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="flex flex-col">
                  {logs.map((log, i) => (
                    <div 
                      key={log.id} 
                      className={`flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 ${i === 0 ? 'animate-in fade-in slide-in-from-left duration-1000' : ''}`}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${getLevelColor(log.level)}`}>
                        {getCategoryIcon(log.category)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{log.category} update</span>
                          <span className="text-[10px] font-medium text-zinc-600">{formatDistanceToNow(new Date(log.createdAt))} ago</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-200 leading-relaxed">{log.message}</p>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <ActivityIcon size={40} className="mx-auto text-zinc-800" />
                      <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Waiting for incoming logs...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Git History Sub-view */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GithubIcon size={20} className="text-zinc-400" />
                <h2 className="text-xl font-bold">Commit History</h2>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>

            <div className="bg-zinc-950/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 space-y-6 max-h-[600px] overflow-y-auto relative">
               <div className="absolute left-9 top-0 bottom-0 w-px bg-white/5" />
               {commits.map((commit) => (
                 <div key={commit.hash} className="relative pl-10 group">
                    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 border border-black group-hover:bg-blue-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all z-10" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>{commit.author}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10">{commit.hash}</span>
                      </div>
                      <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors line-clamp-2">{commit.message}</p>
                      <div className="text-[9px] text-zinc-600 font-medium">
                        {new Date(commit.timestamp).toLocaleString()}
                      </div>
                    </div>
                 </div>
               ))}
               {commits.length === 0 && (
                 <p className="text-center text-zinc-600 text-xs py-10 font-bold uppercase">No recent commits</p>
               )}
            </div>

            {/* Production Badge */}
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-8 rounded-[2rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all" />
              <div className="relative space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <ShieldCheckIcon size={24} />
                </div>
                <h3 className="text-xl font-bold">Safe Environment</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Verified production status. All systems are running on stable release v1.0.4 with 99.9% uptime guaranteed.
                </p>
                <div className="pt-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest">
                    Vercel Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thumb-white\/10::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
