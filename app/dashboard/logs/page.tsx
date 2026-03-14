import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';

export default async function AuditLogPage() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('atlas_admin_token');

  if (!adminToken || adminToken.value !== 'authenticated') {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Access Restricted</h2>
        <p className="text-zinc-500 text-sm max-w-xs text-center">Infrastructure Admin credentials required to view low-level system logs.</p>
      </div>
    );
  }

  const logs = await prisma.auditLog.findMany({
    include: { developer: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const getActionStyles = (action: string) => {
    if (action.includes('CREATE')) return { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', color: 'text-emerald-500', marker: 'bg-emerald-500' };
    if (action.includes('DELETE')) return { border: 'border-rose-500/20', bg: 'bg-rose-500/5', color: 'text-rose-500', marker: 'bg-rose-500' };
    if (action.includes('UPDATE') || action.includes('MOVE')) return { border: 'border-amber-500/20', bg: 'bg-amber-500/5', color: 'text-amber-500', marker: 'bg-amber-500' };
    return { border: 'border-zinc-800', bg: 'bg-zinc-900/40', color: 'text-zinc-400', marker: 'bg-zinc-600' };
  };

  return (
    <div className="p-8 sm:p-12 w-full flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-8 mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Audit Registry</h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Real-time infrastructure surveillance recording every cryptographic event and state change within the developer ecosystem.
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Monitoring</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {logs.length === 0 ? (
          <div className="bg-zinc-950/50 border border-zinc-900 border-dashed rounded-3xl p-20 text-center">
             <p className="text-zinc-600 font-medium tracking-tight">Immutable registry is currently empty.</p>
          </div>
        ) : (
          logs.map((log: any) => {
            const styles = getActionStyles(log.action);
            return (
              <div 
                key={log.id} 
                className={`group relative overflow-hidden bg-zinc-950/40 border ${styles.border} rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:bg-zinc-900/60 hover:scale-[1.005]`}
              >
                {/* Horizontal Gradient Trace on Hover */}
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${styles.marker} opacity-40 group-hover:opacity-100 transition-opacity`}></div>

                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl ${styles.bg} border ${styles.border} flex items-center justify-center shrink-0`}>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${styles.color}`}>
                      {log.action.split('_')[0].substring(0, 3)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-white tracking-wide uppercase mb-1 flex items-center gap-2">
                       {log.action}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                       {log.details || 'No additional metadata provided.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:items-end gap-1.5 shrink-0 pl-12 sm:pl-0 border-l border-zinc-800/50 sm:border-0">
                  <div className="flex items-center gap-2 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                    <span className="text-[11px] font-semibold text-zinc-300 tracking-tight">{log.developer.name}</span>
                  </div>
                  <time className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest pl-1">
                    {new Date(log.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Visual Footer decoration */}
      <div className="mt-12 pt-8 border-t border-zinc-900 flex justify-center opacity-20">
         <div className="flex flex-col items-center gap-2">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-zinc-400 to-transparent"></div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[.3em]">Atlas Secure Sequence Logs</p>
         </div>
      </div>
    </div>
  );
}
