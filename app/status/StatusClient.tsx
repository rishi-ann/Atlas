'use client';

import React, { useState } from 'react';
import { GithubIcon } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// No longer need SystemLog or Health types for the UI if we're only showing commits
type GitCommit = {
  hash: string;
  author: string;
  message: string;
  timestamp: number;
};

export default function StatusClient({ 
  initialCommits,
}: { 
  initialLogs: any[], 
  initialCommits: GitCommit[],
  initialHealth: any
}) {
  const [commits] = useState<GitCommit[]>(initialCommits);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-20">
        <div className="space-y-12">
          {/* Minimal Header */}
          <div className="flex items-center gap-4 border-b border-zinc-900 pb-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
              <GithubIcon size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Commit History</h1>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Live Development Activity</p>
            </div>
          </div>

          {/* Simple Commit List */}
          <div className="relative pl-0.5">
            <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-zinc-900" />
            <div className="space-y-10">
              {commits.map((commit) => (
                <div key={commit.hash} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-black border-2 border-zinc-800 group-hover:border-white transition-colors z-10" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{commit.author}</span>
                      <span className="text-[10px] font-mono text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">
                        {commit.hash}
                      </span>
                    </div>
                    
                    <h2 className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors leading-relaxed">
                      {commit.message}
                    </h2>
                    
                    <div className="text-[10px] text-zinc-600 font-medium pt-1">
                      {new Date(commit.timestamp).toLocaleString(undefined, { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {commits.length === 0 && (
                <div className="py-20 text-center border border-dashed border-zinc-900 rounded-3xl">
                  <p className="text-zinc-600 text-sm font-medium">No recent commits found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
