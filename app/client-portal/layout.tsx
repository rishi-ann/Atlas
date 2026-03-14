import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../lib/prisma';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Files, 
  LogOut,
  Building2
} from 'lucide-react';

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const clientToken = cookieStore.get('client_token');

  if (!clientToken || !clientToken.value) {
    redirect('/client-login');
  }

  const client = await prisma.client.findUnique({
    where: { id: clientToken.value },
    include: {
        developer: true
    }
  });

  if (!client) {
    redirect('/client-login');
  }

  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans">
      
      {/* Client Sidebar */}
      <aside className="w-64 border-r border-zinc-900 bg-black flex flex-col h-screen sticky top-0 z-20">
        <div className="h-20 flex items-center px-6 border-b border-zinc-900">
          <Link href="/client-portal" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img
              src="/icon.png"
              alt="Atlas Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-white">Atlas</span>
          </Link>
        </div>
        
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 px-3 py-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-500 mb-0.5">Organization</p>
              <p className="text-sm font-bold text-white truncate">{client.company || 'Private Client'}</p>
            </div>
          </div>
        </div>

        <nav className="px-3 flex flex-col gap-1 flex-grow">
          <Link href="/client-portal" className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold transition-all">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          
          <Link href="/client-portal/collaboration" className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all text-sm font-medium">
            <MessageSquare className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            Collaboration
          </Link>

          <Link href="/client-portal/files" className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all text-sm font-medium">
            <Files className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            Deliverables
          </Link>
        </nav>
        
        <div className="p-4 mt-auto">
          <form action={async () => {
            'use server';
            const cookieStore = await cookies();
            cookieStore.delete('client_token');
            redirect('/client-login');
          }}>
            <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-semibold group">
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-black relative">
        {/* Decorative noise/gradient */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
        <div className="relative z-10 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
