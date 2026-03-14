'use client';

import React, { useEffect, useState } from 'react';
import { 
  GithubIcon, 
  ServerIcon, 
  ClockIcon, 
  ActivityIcon, 
  AlertCircleIcon,
  CheckCircle2Icon,
  GlobeIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

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
      case 'success': return 'text-emerald-500';
      case 'error': return 'text-rose-500';
      case 'warn': return 'text-amber-500';
      default: return 'text-zinc-400';
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        {/* Simple Health Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
            <p className="text-zinc-500 text-sm mt-1">Real-time health and development activity.</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 ${health.status === 'operational' ? 'text-emerald-500' : 'text-rose-500'}`}>
            {health.status === 'operational' ? <CheckCircle2Icon size={18} /> : <AlertCircleIcon size={18} />}
            <span className="text-sm font-bold capitalize">{health.status}</span>
          </div>
        </div>

        {/* Minimal Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Uptime', value: `${(health.uptime / 3600).toFixed(1)}h` },
            { label: 'Database', value: health.services.database },
            { label: 'API', value: health.services.api },
            { label: 'Chat Server', value: health.services.chat_server },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-sm font-semibold capitalize">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Logs */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <ActivityIcon size={14} /> Activity Feed
            </h2>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg flex items-start gap-3">
                  <div className={`mt-0.5 ${getLevelColor(log.level)}`}>{getCategoryIcon(log.category)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-300">{log.message}</p>
                    <div className="text-[10px] text-zinc-600 mt-1 flex justify-between">
                      <span>{log.category}</span>
                      <span>{formatDistanceToNow(new Date(log.createdAt))} ago</span>
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <p className="text-xs text-zinc-600 italic">No logs found.</p>}
            </div>
          </section>

          {/* Commits */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <GithubIcon size={14} /> Commit History
            </h2>
            <div className="border-l border-zinc-900 ml-1.5 space-y-6">
              {commits.map((commit) => (
                <div key={commit.hash} className="relative pl-6">
                  <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-zinc-800 border border-black" />
                  <div className="text-xs font-bold text-zinc-300 leading-snug">{commit.message}</div>
                  <div className="text-[10px] text-zinc-600 mt-1 flex gap-2 items-center">
                    <span className="font-mono text-zinc-500">{commit.hash}</span>
                    <span>•</span>
                    <span>{commit.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {commits.length === 0 && <p className="text-xs text-zinc-600 italic pl-1.5">No commits found.</p>}
        </div>
      </main>

      <Footer />
    </div>
  );
}
