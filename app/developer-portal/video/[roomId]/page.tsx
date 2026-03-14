import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import VideoJoinClient from './VideoJoinClient';

const JWT_SECRET = process.env.CHAT_JWT_SECRET || 'atlas-dev-chat-secret-2025';

export default async function VideoRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  const cookieStore = await cookies();
  const devToken = cookieStore.get('dev_token');

  if (!devToken || !devToken.value) redirect('/dev-login');

  const developer = await prisma.developer.findUnique({
    where: { id: devToken.value },
    select: { id: true, name: true, email: true, status: true }
  });

  if (!developer || developer.status !== 'approved') redirect('/dev-login');

  const token = jwt.sign(
    { id: developer.id, name: developer.name, email: developer.email },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  return <VideoJoinClient token={token} developer={developer} roomId={roomId} />;
}
