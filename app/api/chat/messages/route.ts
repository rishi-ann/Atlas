import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'atlas-internal-secret-2025';

// Save a new message (called from chat server)
export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-internal-secret');
  if (auth !== INTERNAL_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { senderId, senderName, content, receiverId, channel } = await req.json();
  if (!senderId || !senderName || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const msg = await prisma.chatMessage.create({
    data: { senderId, senderName, content, receiverId, channel: channel || 'all' }
  });

  return NextResponse.json({ id: msg.id });
}

// Fetch recent messages (called from client)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const userId = searchParams.get('userId'); // to fetch DM conversations

  const messages = await prisma.chatMessage.findMany({
    where: userId ? {
      OR: [
        { channel: 'all' },
        { channel: 'admin' },
        { senderId: userId },
        { receiverId: userId }
      ]
    } : {
      OR: [
        { channel: 'all' },
        { channel: 'admin' }
      ]
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  return NextResponse.json(messages);
}
