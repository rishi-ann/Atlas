'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clientLogin } from './actions';

export default function ClientLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await clientLogin(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/client-portal');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-zinc-800">
      <div className="absolute top-10 left-10">
        <Link href="/" className="text-zinc-600 hover:text-zinc-300 transition-colors flex items-center gap-2 text-xs font-mono uppercase tracking-widest">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Atlas / Home
        </Link>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-transparent border border-zinc-900 rounded-2xl p-8 sm:p-10 relative">
          
          <div className="mb-10 text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-3">
              Client Portal
            </h1>
            <p className="text-zinc-500 text-xs leading-relaxed font-medium">
              Identify yourself using the <span className="text-zinc-300">RED-XXXX</span> reference.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Reference ID</label>
              <input 
                type="text" 
                name="clientId" 
                required 
                placeholder="RED-9482"
                disabled={loading}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-800 outline-none focus:border-zinc-700 transition-all font-mono"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl">
                <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full px-4 py-3.5 bg-zinc-100 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                'Identify'
              )}
            </button>
          </form>

          <p className="mt-8 pt-6 border-t border-zinc-900 text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center">
            Secured Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
