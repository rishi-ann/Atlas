import { cookies } from 'next/headers';
import { prisma } from '../../lib/prisma';
import { FileText, Image as ImageIcon, CheckCircle2, FileDown, User, Calendar, ExternalLink } from 'lucide-react';

export default async function DeveloperDeliverablesPage() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get('dev_token');

  if (!devToken || !devToken.value) return null;

  // Fetch deliverables from clients assigned to THIS developer
  const clientsWithDeliverables = await prisma.client.findMany({
    where: { developerId: devToken.value },
    include: {
      deliverables: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const deliverables = clientsWithDeliverables.flatMap(c =>
    c.deliverables.map(d => ({ ...d, clientName: c.name }))
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'paper': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      default: return <FileText className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="p-8 sm:p-12 w-full max-w-6xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-10 mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Client Deliverables</h1>
          <p className="text-zinc-500 text-sm font-medium">
            Review and download artifacts submitted by your assigned client cluster.
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {deliverables.length} Active Artifacts
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deliverables.length === 0 ? (
          <div className="col-span-full py-32 border border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-40">
            <CloudIcon className="w-12 h-12 text-zinc-700 mb-6" />
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Repository Empty</h3>
            <p className="text-zinc-500 text-sm font-medium max-w-xs">No client artifacts have been synced to your technical workspace yet.</p>
          </div>
        ) : (
          deliverables.map(file => (
            <div key={file.id} className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 hover:border-zinc-800 transition-all group relative overflow-hidden">
               {/* Aesthetic Background Accent */}
               <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
               
               <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                    {getIcon(file.fileType)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate pr-2">{file.title}</h4>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{file.fileType} · {file.fileSize || 'Syncing'}</p>
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-zinc-900 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-zinc-700" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Origin</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-500 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                        {file.clientName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-zinc-700" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Timestamp</span>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-300">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
               </div>

               <div className="mt-8 flex gap-3 relative z-10">
                  <a 
                    href={file.fileUrl} 
                    target="_blank" 
                    className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-white hover:text-black hover:border-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-3 h-3" />
                    Download
                  </a>
                  <a 
                    href={file.fileUrl} 
                    target="_blank" 
                    className="w-11 py-3 bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-white rounded-xl flex items-center justify-center transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CloudIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
    );
}
