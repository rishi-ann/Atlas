'use client';

import React, { useEffect, useState } from 'react';
import { 
  GithubIcon, 
  TerminalIcon, 
  SearchIcon, 
  FilterIcon,
  ChevronRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  ActivityIcon,
  CheckCircle2Icon,
  AlertCircleIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  const [activeTab, setActiveTab] = useState<'logs' | 'commits'>('logs');

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

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#000] text-[#fff] font-mono selection:bg-[#333] flex flex-col">
      <Navbar />
      
      {/* Vercel-style deployment header */}
      <div className="border-b border-[#333] bg-[#000]">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center">
                <ShieldCheckIcon size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">Atlas Production</h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#111] border border-[#333] text-[10px] uppercase font-bold text-[#888]">
                    main
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#888] mt-1 font-sans">
                  <span className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${health.status === 'operational' ? 'bg-[#50e3c2]' : 'bg-[#e00]'} shadow-[0_0_8px_rgba(80,227,194,0.4)]`} />
                    {health.status === 'operational' ? 'Operational' : 'Degraded'}
                  </span>
                  <span>•</span>
                  <span>v1.0.4</span>
                  <span>•</span>
                  <span>{new Date(health.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-sans">
              <button className="px-4 py-1.5 rounded-md bg-[#fff] text-[#000] text-sm font-medium hover:bg-[#ccc] transition-colors">
                Redeploy
              </button>
              <button className="px-3 py-1.5 rounded-md border border-[#333] text-sm font-medium hover:bg-[#111] transition-colors">
                ...
              </button>
            </div>
          </div>

          {/* Vercel Tabs */}
          <div className="flex items-center border-b border-transparent font-sans">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-white text-white' : 'border-transparent text-[#888] hover:text-white'}`}
            >
              Runtime Logs
            </button>
            <button 
              onClick={() => setActiveTab('commits')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'commits' ? 'border-white text-white' : 'border-transparent text-[#888] hover:text-white'}`}
            >
              Git History
            </button>
          </div>
        </div>
      </div>

      <main className="flex-grow flex flex-col bg-[#000]">
        <div className="max-w-[1400px] mx-auto w-full flex-grow flex flex-col px-6">
          
          {/* Vercel Search/Filter Bar */}
          <div className="flex items-center gap-2 py-4 border-b border-[#111]">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={14} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                className="w-full bg-transparent border-none outline-none pl-9 text-sm text-white placeholder-[#666] h-8"
              />
            </div>
            <div className="h-4 w-px bg-[#333] mx-2" />
            <button className="flex items-center gap-2 text-[#888] hover:text-white text-sm px-2">
              <FilterIcon size={14} />
              <span>Filter</span>
            </button>
          </div>

          {/* Real-time Log Engine Look */}
          <div className="flex-grow overflow-auto py-4 font-mono text-xs leading-relaxed">
            {activeTab === 'logs' ? (
              <div className="space-y-0.5">
                {logs.map((log) => (
                  <div key={log.id} className="group flex gap-4 hover:bg-[#111] px-2 py-0.5 rounded transition-colors border-l-2 border-transparent hover:border-[#333]">
                    <span className="text-[#444] shrink-0 w-24">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{(new Date(log.createdAt).getMilliseconds()).toString().padStart(3, '0')}
                    </span>
                    <span className={`shrink-0 w-16 uppercase font-bold ${getLevelStyles(log.level)}`}>
                      [{log.level}]
                    </span>
                    <span className="text-[#888] shrink-0 w-20">[{log.category}]</span>
                    <span className="text-zinc-300 break-all">{log.message}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="py-20 text-center text-[#444] animate-pulse">
                    READY AND WAITING FOR LOGS...
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {commits.map((commit) => (
                  <div key={commit.hash} className="p-4 bg-[#0a0a0a] border border-[#111] rounded-lg hover:border-[#333] transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <GithubIcon size={18} className="text-[#888]" />
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                            {commit.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#666] mt-1">
                            <span className="font-mono bg-[#111] px-1.5 py-0.5 rounded border border-[#333]">{commit.hash}</span>
                            <span>•</span>
                            <span className="font-semibold text-[#888]">{commit.author}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(commit.timestamp))} ago</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRightIcon size={16} className="text-[#333] group-hover:text-white transition-all transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Vercel Status Bar Footer */}
      <footer className="border-t border-[#333] bg-[#000] px-6 py-2">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[10px] text-[#666] font-sans">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#50e3c2]" />
              Real-time feed connected
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon size={10} />
              Latency: 14ms
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Region: ARN1</span>
            <span className="text-white">Powered by Atlas Core</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
