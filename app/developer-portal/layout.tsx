import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../lib/prisma';
import { 
  BarChart3, 
  Kanban, 
  Code2, 
  Users2, 
  Files, 
  Settings2, 
  MessageCircle, 
  PhoneCall, 
  LogOut 
} from 'lucide-react';

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const devToken = cookieStore.get('dev_token');

  if (!devToken || !devToken.value) {
    redirect('/dev-login');
  }

  const dev = await prisma.developer.findUnique({
    where: { id: devToken.value }
  });

  if (!dev) {
    redirect('/dev-login');
  }

  // Ping to mark developer as recently active
  await prisma.developer.update({
    where: { id: devToken.value },
    data: { lastSeenAt: new Date() }
  });

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-zinc-800">
      
      {/* Sidebar Navbar */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950/50 flex flex-col h-screen sticky top-0 z-20">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img
              src="/icon.png"
              alt="Atlas Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-white">Atlas</span>
          </Link>
        </div>
        
        <div className="px-6 py-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-500 text-sm">
                {dev.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{dev.name}</p>
              <p className="text-[11px] text-zinc-500 font-medium">Internal Developer</p>
            </div>
          </div>
        </div>

        <nav className="p-4 flex flex-col gap-1 flex-grow overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-bold text-zinc-600 px-3 mt-4 mb-2 tracking-wide">Workspace</div>
          <Link href="/developer-portal" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 text-white text-sm font-semibold transition-all">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Overview
          </Link>
          <Link href="/developer-portal/board" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Kanban className="w-4 h-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
            Task Kanban
          </Link>
          <Link href="/developer-portal/playground" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Code2 className="w-4 h-4 text-zinc-500 group-hover:text-purple-500 transition-colors" />
            Playground
          </Link>
          <Link href="/developer-portal/clients" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Users2 className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
            Clients
          </Link>
          <Link href="/developer-portal/deliverables" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Files className="w-4 h-4 text-zinc-500 group-hover:text-amber-500 transition-colors" />
            Deliverables
          </Link>
          <Link href="/developer-portal/settings" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Settings2 className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            Settings
          </Link>
          
        </nav>
        
        <div className="p-4 mt-auto border-t border-white/5">
          <form action={async () => {
            'use server';
            const cookieStore = await cookies();
            cookieStore.delete('dev_token');
            redirect('/dev-login');
          }}>
            <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-semibold group">
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[length:100px] relative">
        {children}
      </main>
    </div>
  );
}
