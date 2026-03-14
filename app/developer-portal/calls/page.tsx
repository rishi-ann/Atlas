import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CallHistoryPage() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get('dev_token');

  if (!devToken || !devToken.value) redirect('/dev-login');

  const developer = await prisma.developer.findUnique({
    where: { id: devToken.value },
    select: { id: true, name: true, status: true }
  });

  if (!developer || developer.status !== 'approved') redirect('/dev-login');

  // Fetch call logs involving this developer
  const calls = await prisma.callLog.findMany({
    where: {
      OR: [{ callerId: developer.id }, { receiverId: developer.id }]
    },
    orderBy: { startedAt: 'desc' },
    take: 100,
  });

  const formatDuration = (secs: number | null) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    accepted: { label: 'Answered', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    ended:    { label: 'Ended',    color: 'text-zinc-400',    bg: 'bg-zinc-900',       border: 'border-zinc-800'       },
    rejected: { label: 'Declined', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
    missed:   { label: 'Missed',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
    initiated:{ label: 'Ringing',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  };

  return (
    <div className="p-8 sm:p-12 w-full flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-8 mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Call History</h1>
          <p className="text-zinc-400 text-sm">All video call activity for your developer account.</p>
        </div>
        <div className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{calls.length} records</span>
        </div>
      </div>

      {calls.length === 0 ? (
        <div className="py-24 border border-zinc-900 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3">
          <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <p className="text-zinc-600 text-sm font-medium italic">No call history yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {calls.map(call => {
            const isOutgoing = call.callerId === developer.id;
            const cfg = statusConfig[call.status] || statusConfig.initiated;
            const otherName = isOutgoing ? (call.receiverName || 'Unknown') : call.callerName;

            return (
              <div key={call.id} className={`flex items-center justify-between bg-zinc-950 border ${cfg.border} rounded-2xl px-5 py-4 gap-4 hover:bg-zinc-900/60 transition-colors`}>
                <div className="flex items-center gap-4">
                  {/* Direction icon */}
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                    {isOutgoing ? (
                      <svg className={`w-4 h-4 ${cfg.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className={`w-4 h-4 ${cfg.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">{otherName}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {isOutgoing ? 'Outgoing' : 'Incoming'} ·{' '}
                      {new Date(call.startedAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Duration */}
                  <div className="text-right">
                    <p className="text-xs font-mono text-zinc-300 font-semibold">{formatDuration(call.durationSecs)}</p>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">Duration</p>
                  </div>

                  {/* Status badge */}
                  <div className={`px-3 py-1 rounded-full border ${cfg.bg} ${cfg.border} text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>
                    {cfg.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
