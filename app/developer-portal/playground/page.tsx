import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import PlaygroundClient from './PlaygroundClient';
import jwt from 'jsonwebtoken';

export default async function PlaygroundPage() {
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

  // Generate a chat/playground token if not already handled
  const JWT_SECRET = process.env.CHAT_JWT_SECRET || "atlas-dev-chat-secret-2025";
  const token = jwt.sign(
    { id: dev.id, name: dev.name, email: dev.email },
    JWT_SECRET
  );

  return (
    <div className="h-screen overflow-hidden">
      <PlaygroundClient token={token} developer={{ id: dev.id, name: dev.name }} />
    </div>
  );
}
