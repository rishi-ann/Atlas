import { prisma } from '../../lib/prisma';
import { deleteDeveloper } from '../developers/actions';

export const dynamic = 'force-dynamic';

export default async function ActiveDevelopersPage() {
  const allDevs = await prisma.developer.findMany({
    where: { status: 'approved' },
    orderBy: { lastSeenAt: { sort: 'desc', nulls: 'last' } },
    include: {
      _count: { select: { tasks: true, clients: true, logs: true } }
    }
  });

  const now = new Date();

  const isOnline = (lastSeen: Date | null) => {
    if (!lastSeen) return false;
    return (now.getTime() - new Date(lastSeen).getTime()) < 15 * 60 * 1000; // 15 min
  };

  const isRecent = (lastSeen: Date | null) => {
    if (!lastSeen) return false;
    return (now.getTime() - new Date(lastSeen).getTime()) < 60 * 60 * 1000; // 1 hour
  };

  const onlineDevs = allDevs.filter(d => isOnline(d.lastSeenAt));
  const recentDevs = allDevs.filter(d => !isOnline(d.lastSeenAt) && isRecent(d.lastSeenAt));
  const inactiveDevs = allDevs.filter(d => !isRecent(d.lastSeenAt));

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never logged in';
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="p-8 sm:p-12 w-full flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-8 mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Active Sessions</h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Real-time overview of all developer sessions currently active on the Atlas platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{onlineDevs.length} Online</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{allDevs.length} Total</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Active Now</p>
          <p className="text-4xl font-bold text-emerald-400">{onlineDevs.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Within the last 15 minutes</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Recently Active</p>
          <p className="text-4xl font-bold text-amber-400">{recentDevs.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Within the last hour</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Inactive</p>
          <p className="text-4xl font-bold text-zinc-500">{inactiveDevs.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Not seen in over an hour</p>
        </div>
      </div>

      {/* Developer Grid */}
      <div className="space-y-6">
        {onlineDevs.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineDevs.map(dev => (
                <DevCard key={dev.id} dev={dev} status="online" timeLabel={formatTime(dev.lastSeenAt)} getInitials={getInitials} />
              ))}
            </div>
          </section>
        )}

        {recentDevs.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Recently Active
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDevs.map(dev => (
                <DevCard key={dev.id} dev={dev} status="recent" timeLabel={formatTime(dev.lastSeenAt)} getInitials={getInitials} />
              ))}
            </div>
          </section>
        )}

        {inactiveDevs.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
              Offline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveDevs.map(dev => (
                <DevCard key={dev.id} dev={dev} status="offline" timeLabel={formatTime(dev.lastSeenAt)} getInitials={getInitials} />
              ))}
            </div>
          </section>
        )}

        {allDevs.length === 0 && (
          <div className="py-24 border border-zinc-900 border-dashed rounded-3xl flex items-center justify-center">
            <p className="text-zinc-600 text-sm font-medium italic">No approved developers found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DevCard({
  dev,
  status,
  timeLabel,
  getInitials,
}: {
  dev: any;
  status: 'online' | 'recent' | 'offline';
  timeLabel: string;
  getInitials: (name: string) => string;
}) {
  const statusConfig = {
    online: { dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'Online' },
    recent: { dot: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400', label: 'Away' },
    offline: { dot: 'bg-zinc-700', text: 'text-zinc-500', badge: 'bg-zinc-900 border-zinc-800 text-zinc-500', label: 'Offline' },
  }[status];

  const colors = ['bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-cyan-500'];
  let hash = 0;
  for (const c of dev.name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];

  return (
    <div className={`bg-zinc-950 border ${status === 'online' ? 'border-emerald-900/30' : 'border-zinc-900'} rounded-2xl p-5 flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-[11px] font-black text-white`}>
            {getInitials(dev.name)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">{dev.name}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{dev.email}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${statusConfig.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
          {statusConfig.label}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-3 border-t border-zinc-900">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{dev._count.tasks}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Tasks</p>
        </div>
        <div className="text-center border-x border-zinc-900">
          <p className="text-lg font-bold text-white">{dev._count.clients}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Clients</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{dev._count.logs}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Actions</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Last Seen</span>
          <span className={`text-[10px] font-semibold font-mono ${statusConfig.text}`}>{timeLabel}</span>
        </div>
        <form action={deleteDeveloper.bind(null, dev.id)}>
          <button type="submit" className="text-red-400 hover:text-red-300 font-medium text-[10px] border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
            Delete Access
          </button>
        </form>
      </div>
    </div>
  );
}
