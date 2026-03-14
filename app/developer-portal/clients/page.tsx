import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';

export default async function DeveloperClientsPage() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get('dev_token');

  if (!devToken || !devToken.value) {
    redirect('/dev-login');
  }

  const clients = await prisma.client.findMany({
    where: { developerId: devToken.value },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 sm:p-12 w-full flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-8 mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Assigned Clients</h1>
          <p className="text-zinc-400 text-sm">
            Core directory of all client profiles assigned to your workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
         {clients.length === 0 ? (
            <div className="col-span-full py-24 bg-zinc-950/20 border border-zinc-900 border-dashed rounded-3xl flex flex-col items-center justify-center text-center">
              <p className="text-zinc-600 font-medium italic">No client records found in your directory.</p>
            </div>
         ) : (
            clients.map((client : any) => (
               <div key={client.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 transition-all hover:bg-zinc-900/50 hover:border-zinc-800 flex flex-col gap-5">
                 <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                       <span className="text-sm font-bold text-zinc-400">{client.name.charAt(0)}</span>
                    </div>
                    <span className="text-[10px] font-black text-rose-500 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded tracking-widest uppercase">
                       {client.clientRef}
                    </span>
                 </div>

                 <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white tracking-tight">{client.name}</h3>
                    {client.company && (
                       <div className="flex items-center gap-1.5 opacity-60">
                          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{client.company}</span>
                       </div>
                    )}
                 </div>

                 <div className="pt-4 border-t border-zinc-900 flex flex-col gap-2">
                    <div className="space-y-1.5">
                       <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Connective Channels</span>
                       {client.emails.map((email: string, i: number) => (
                           <div key={i} className="flex items-center justify-between group">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.05em]">{i === 0 ? 'Primary' : `Alt ${i}`}</span>
                              <span className="text-xs text-zinc-300 group-hover:text-white transition-colors truncate max-w-[160px]">{email}</span>
                           </div>
                       ))}
                       {client.phones.map((phone: string, i: number) => (
                           <div key={i} className="flex items-center justify-between group pt-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.05em]">Line {i + 1}</span>
                              <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{phone}</span>
                           </div>
                       ))}
                    </div>
                    {client.authorizedName && (
                       <div className="flex items-center justify-between group">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Auth Rep</span>
                          <span className="text-xs text-zinc-400 italic">{client.authorizedName}</span>
                       </div>
                    )}
                 </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
}
