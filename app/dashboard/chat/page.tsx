import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import AdminChatWrapper from './AdminChatWrapper';

const JWT_SECRET = process.env.CHAT_JWT_SECRET || 'atlas-dev-chat-secret-2025';

export const dynamic = 'force-dynamic';

export default async function AdminChatPage() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('atlas_admin_token');

  if (!adminToken || adminToken.value !== 'authenticated') {
    redirect('/login');
  }

  const allDevelopers = await prisma.developer.findMany({
    where: { status: 'approved' },
    select: { id: true, name: true, email: true, lastSeenAt: true }
  });

  const now = new Date();
  const devs = allDevelopers.map(d => ({
    id: d.id,
    name: d.name,
    email: d.email,
    isPortalActive: d.lastSeenAt ? (now.getTime() - new Date(d.lastSeenAt).getTime() < 15 * 60 * 1000) : false
  }));

  const token = jwt.sign(
    { id: 'admin', name: 'System Admin', email: 'admin@atlas.local' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <div className="p-8 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">System Communications</h1>
        <p className="text-zinc-400 text-sm max-w-xl">
          Broadcast announcements and monitor internal developer chatter in real-time.
        </p>
      </div>
      <div className="flex-1 overflow-hidden pb-8 px-8">
        <AdminChatWrapper token={token} allDevelopers={devs} />
      </div>
    </div>
  );
}
