import { cookies } from 'next/headers';
import { prisma } from '../lib/prisma';
import { 
  Briefcase, 
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
    <div className="p-12 sm:p-20 max-w-5xl">
      {/* Personalized Greeting */}
      <div className="mb-20">
        <h1 className="text-5xl font-bold tracking-tighter text-white mb-4">
          Welcome, {client.name.split(' ')[0]}
        </h1>
        <p className="text-zinc-500 font-medium text-lg tracking-tight">
          Project briefing and authentication overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        {/* Client Account Information */}
        <section>
          <h3 className="text-[11px] font-bold text-zinc-700 uppercase tracking-[0.2em] mb-8">Identification</h3>
          <div className="space-y-6">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Company Reference</p>
              <p className="text-xl font-bold text-white tracking-tight">{client.company || 'Private Entry'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">System Reference</p>
              <p className="text-xl font-bold text-white tracking-tight font-mono">{client.clientRef}</p>
            </div>
          </div>
        </section>

        {/* Assigned Developer Information */}
        <section>
          <h3 className="text-[11px] font-bold text-zinc-700 uppercase tracking-[0.2em] mb-8">Technical Assignment</h3>
          {client.developer ? (
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-500">
                {client.developer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Primary Architect</p>
                <p className="text-xl font-bold text-white tracking-tight">{client.developer.name}</p>
                <p className="text-zinc-600 text-xs font-medium mt-1">Status: Active</p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/30">
              <p className="text-zinc-600 text-sm font-medium italic">Awaiting technical specialist assignment.</p>
            </div>
          )}
        </section>
      </div>

      <footer className="mt-40 pt-10 border-t border-zinc-900">
        <p className="text-[10px] font-bold text-zinc-800 tracking-widest uppercase italic">
          Atlas v2.1 Infrastructure
        </p>
      </footer>
    </div>
  );
}
