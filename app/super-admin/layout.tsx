import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const superToken = cookieStore.get('super_admin_token');

  if (!superToken || superToken.value !== 'true') {
    redirect('/super-admin-login');
  }

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-rose-500/30">
      
      {/* Sidebar Navbar */}
      <aside className="w-64 border-r border-white/5 bg-[#050505] flex flex-col h-screen sticky top-0 z-20">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
           <h2 className="text-xl font-bold tracking-tighter text-rose-500">SuperAdmin</h2>
        </div>
        
        <div className="px-6 py-5 border-b border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">System Controller</p>
          <p className="text-sm font-medium text-white tracking-tight truncate flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
             Global Administrator
          </p>
        </div>

        <nav className="p-4 flex flex-col gap-2 flex-grow">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-3 mt-4 mb-2">Operations</div>
          <Link href="/super-admin" className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full border border-zinc-600"></span>
            Overview
          </Link>
          <Link href="/super-admin/clients" className="px-3 py-2.5 rounded-lg text-rose-400 text-sm font-medium bg-rose-500/10 hover:bg-rose-500/20 transition-colors flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
            Manage Clients
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <form action={async () => {
            'use server';
            const cookieStore = await cookies();
            cookieStore.delete('super_admin_token');
            redirect('/super-admin-login');
          }}>
            <button type="submit" className="w-full text-center px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 transition-colors text-sm font-semibold shadow-sm">
              Global Logout
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
