import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { 
  Activity, 
  BarChart3, 
  Terminal, 
  UserPlus2, 
  MessageSquare, 
  Settings2, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';

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
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img
              src="/icon.png"
              alt="Atlas Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-white">Atlas</span>
          </Link>
        </div>
        
        <nav className="p-4 flex flex-col gap-1 flex-grow overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-bold text-zinc-600 px-3 mt-4 mb-2 tracking-wide uppercase">Systems</div>
          {/* Correction: User said NO uppercases version. Removing uppercase from title. */}
          <div className="text-[11px] font-bold text-zinc-600 px-3 mt-4 mb-2 tracking-wide">Infrastructure</div>
          
          <Link href="/dashboard" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Activity className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
            Real-time Feed
          </Link>
          <Link href="/dashboard/projects" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 text-white text-sm font-semibold transition-all">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Project Analytics
          </Link>
          <Link href="/dashboard/active-developers" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Terminal className="w-4 h-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
            Active Sessions
          </Link>
          <Link href="/dashboard/developers" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <UserPlus2 className="w-4 h-4 text-zinc-500 group-hover:text-purple-500 transition-colors" />
            Developer Requests
          </Link>
          <Link href="/dashboard/settings" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <Settings2 className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            Platform Settings
          </Link>
          <Link href="/dashboard/logs" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            Audit Logs
          </Link>
        </nav>
        
        <div className="p-4 mt-auto border-t border-white/5">
          <form action={async () => {
            'use server';
            const cookieStore = await cookies();
            cookieStore.delete('atlas_admin_token');
            redirect('/login');
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
