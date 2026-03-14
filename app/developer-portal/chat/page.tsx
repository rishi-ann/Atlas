import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import DevChatClient from './DevChatClient';

const JWT_SECRET = process.env.CHAT_JWT_SECRET || 'atlas-dev-chat-secret-2025';

export default async function DevChatPage() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get('dev_token');

  if (!devToken || !devToken.value) {
    redirect('/dev-login');
  }

  const developer = await prisma.developer.findUnique({
    where: { id: devToken.value },
    select: { id: true, name: true, email: true, status: true }
  });

  if (!developer || developer.status !== 'approved') {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-semibold">Access denied. Account is pending approval.</p>
      </div>
    );
  }

  const token = jwt.sign(
    { id: developer.id, name: developer.name, email: developer.email },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  return <DevChatClient token={token} developer={developer} />;
}
