import { cookies } from 'next/headers';
import { prisma } from '../lib/prisma';
import { 
  Building2, 
  User, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  MessageSquare,
  FileText
} from 'lucide-react';

export default async function ClientDashboardPage() {
  const cookieStore = await cookies();
  const clientToken = cookieStore.get('client_token');

  const client = await prisma.client.findUnique({
    where: { id: clientToken?.value },
    include: {
      developer: true
    }
  });

  if (!client) return null;

  return (
    <div className="p-12 sm:p-16 max-w-5xl">
      {/* Executive Greeting */}
      <div className="mb-16">
        <h1 className="text-5xl font-light tracking-[calc(-0.05em)] text-white mb-4 leading-tight">
          Good day, <span className="font-semibold">{client.name.split(' ')[0]}</span>.
        </h1>
        <p className="text-zinc-500 font-medium text-base max-w-xl leading-relaxed">
          Your project infrastructure is operational. Here is your current operational overview.
        </p>
      </div>

      {/* Unique Status Roadmap */}
      <div className="relative space-y-12 ml-2">
        {/* Central Vertical Line */}
        <div className="absolute left-[31px] top-4 bottom-4 w-px bg-zinc-900"></div>

        {/* Phase 01: Identification */}
        <div className="relative flex items-start gap-8 group">
          <div className="z-10 w-16 h-16 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-2xl group-hover:border-white/20 transition-all shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="pt-2">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">01 / Ecosystem</h3>
            <div className="space-y-1">
              <p className="text-xl font-bold text-white tracking-tight">{client.company || 'Private Establishment'}</p>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Ref: <span className="font-mono text-white/50">{client.clientRef}</span></p>
            </div>
          </div>
        </div>

        {/* Phase 02: Assignment */}
        <div className="relative flex items-start gap-8 group">
          <div className="z-10 w-16 h-16 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-2xl group-hover:border-white/20 transition-all shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="pt-2">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">02 / Technical Handler</h3>
            {client.developer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-white tracking-tight">{client.developer.name}</p>
                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">Active</div>
                </div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Primary Solutions Architect</p>
              </div>
            ) : (
              <p className="text-zinc-600 text-xs font-medium italic">Allocation in progress...</p>
            )}
          </div>
        </div>

        {/* Phase 03: Operational Status */}
        <div className="relative flex items-start gap-8 group">
          <div className="z-10 w-16 h-16 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-2xl group-hover:border-white/20 transition-all shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="pt-2">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">03 / Infrastructure</h3>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse"></span>
              <p className="text-lg font-bold text-white tracking-tight">System Operational</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-32 pt-10 border-t border-zinc-900/50">
        <p className="text-[10px] font-bold text-zinc-700 tracking-[0.3em] uppercase">
          Atlas v2.1 — Authorized Instance
        </p>
      </footer>
    </div>
  );
}
