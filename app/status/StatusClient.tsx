'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  SearchIcon, 
  FilterIcon,
  ClockIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import Navbar from '../../components/Navbar';

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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const hRes = await fetch('/api/system/health');
        const hData = await hRes.json();
        setHealth(hData);

        const lRes = await fetch('/api/system/logs?limit=100');
        const lData = await lRes.json();
        setLogs(lData);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Merge and sort logs and commits into a unified feed
  const unifiedFeed = useMemo(() => {
    const gitLogs: SystemLog[] = commits.map(c => ({
      id: c.hash,
      level: 'success',
      category: 'git',
      message: `${c.message} (${c.hash}) by ${c.author}`,
      metadata: { hash: c.hash, author: c.author },
      createdAt: new Date(c.timestamp).toISOString()
    }));

    const merged = [...logs, ...gitLogs];
    return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [logs, commits]);

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#000] text-[#fff] font-mono selection:bg-[#333] flex flex-col overflow-hidden">
      <Navbar />
      
      {/* Vercel-style deployment header */}
      <div className="border-b border-[#111] bg-[#000]">
        <div className="max-w-[1400px] mx-auto px-6 py-6 font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center">
                <ShieldCheckIcon size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight">Deployment Logs</h1>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#111] border border-[#333] text-[9px] uppercase font-black text-[#666]">
                    production
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#666] mt-0.5">
                  <span className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${health.status === 'operational' ? 'bg-[#50e3c2]' : 'bg-[#e00]'}`} />
                    {health.status === 'operational' ? 'Operational' : 'Issues'}
                  </span>
                  <span>•</span>
                  <span>{new Date(health.timestamp).toLocaleTimeString()}</span>
                  <span>•</span>
                  <span>Atlas v1.0.4</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-6 w-px bg-[#333] hidden md:block" />
              <button className="text-[11px] text-[#888] hover:text-white transition-colors uppercase tracking-widest font-black">
                Redeploy
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow flex flex-col bg-[#000] overflow-hidden">
        <div className="max-w-[1400px] mx-auto w-full flex-grow flex flex-col px-6">
          
          {/* Minimal Search bar */}
          <div className="flex items-center gap-2 py-3 border-b border-[#111]">
            <SearchIcon className="text-[#333]" size={12} />
            <input 
              type="text" 
              placeholder="Query deployment logs..." 
              className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-[#333] h-6"
            />
            <button className="flex items-center gap-2 text-[#444] hover:text-white text-[10px] font-bold uppercase tracking-widest px-2">
              <FilterIcon size={12} />
              <span>Filter</span>
            </button>
          </div>

          {/* Unified Terminal Feed */}
          <div className="flex-grow overflow-auto py-6 font-mono text-[11px] leading-[1.8]">
            <div className="space-y-0.5">
              {unifiedFeed.map((log) => (
                <div key={log.id} className="group flex gap-4 hover:bg-[#111] px-2 py-0.25 transition-all">
                  <span className="text-[#444] shrink-0 w-24">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{(new Date(log.createdAt).getMilliseconds()).toString().padStart(3, '0')}
                  </span>
                  <span className={`shrink-0 w-16 uppercase font-bold ${getLevelStyles(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-[#666] shrink-0 w-20">[{log.category}]</span>
                  <span className="text-zinc-300 break-all select-text cursor-text">
                    {log.message}
                  </span>
                </div>
              ))}
              {unifiedFeed.length === 0 && (
                <div className="py-20 text-center text-[#222] font-black tracking-widest uppercase italic">
                  &gt; Initializing Log Engine...
                </div>
              )}
              {/* Bottom padding for auto-scroll feel */}
              <div className="h-20" />
            </div>
          </div>
        </div>
      </main>

      {/* Vercel Status Bar Footer */}
      <footer className="border-t border-[#111] bg-[#000] px-6 py-2">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[10px] text-[#444] font-sans">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#50e3c2] animate-pulse" />
              Connected to arn1
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon size={10} />
              12ms Engine Latency
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#888] font-black uppercase tracking-widest">Atlas Live Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
