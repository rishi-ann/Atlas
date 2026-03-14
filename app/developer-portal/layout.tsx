import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../lib/prisma';

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
          <Link href="/" className="inline-block group grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
            <img
              src="https://ik.imagekit.io/dypkhqxip/logo_atlas.png"
              alt="Atlas Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>
        
        <div className="px-6 py-5 border-b border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Authenticated Developer</p>
          <p className="text-sm font-medium text-white tracking-tight truncate flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             {dev.name}
          </p>
        </div>

        <nav className="p-4 flex flex-col gap-2 flex-grow">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-3 mt-4 mb-2">Workspace</div>
          <Link href="/developer-portal" className="px-3 py-2.5 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Overview
          </Link>
          <Link href="/developer-portal/board" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Task Kanban
          </Link>
          <Link href="/developer-portal/playground" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            Coding Playground
          </Link>
          <Link href="/developer-portal/clients" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Clients
          </Link>
          <Link href="/developer-portal/quotes" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Quote Generator
          </Link>
          <Link href="/developer-portal/settings" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Account Settings
          </Link>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-3 mt-4 mb-2">Team</div>
          <Link href="/developer-portal/chat" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
            Dev Chat
          </Link>
          <Link href="/developer-portal/calls" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Call History
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <form action={async () => {
            'use server';
            const cookieStore = await cookies();
            cookieStore.delete('dev_token');
            redirect('/dev-login');
          }}>
            <button type="submit" className="w-full text-center px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 transition-colors text-sm font-semibold shadow-sm">
              Log out
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
