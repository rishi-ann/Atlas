import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        
        <nav className="p-4 flex flex-col gap-2 flex-grow">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-3 mt-4 mb-2">Systems</div>
          <Link href="/dashboard" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Real-time Feed
          </Link>
          <Link href="/dashboard/projects" className="px-3 py-2.5 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Project Analytics
          </Link>
          <Link href="/dashboard/active-developers" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
            Active Sessions
          </Link>
          <Link href="/dashboard/developers" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Developer Requests
          </Link>
          <Link href="/dashboard/chat" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Internal Messaging
          </Link>
          <Link href="/dashboard/settings" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Platform Settings
          </Link>
          <Link href="/dashboard/logs" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Audit Logs
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <form action={async () => {
            'use server';
            (await cookies()).delete('atlas_admin_token');
            redirect('/login');
          }}>
            <button type="submit" className="w-full text-center px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all focus:ring-2 focus:ring-red-500/50 font-semibold text-sm">
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
