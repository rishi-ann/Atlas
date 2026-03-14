import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'atlas-internal-secret-2025';

// Create or update a call log
export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-internal-secret');
  if (auth !== INTERNAL_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, roomId, callerId, callerName, receiverId, receiverName, status, durationSecs } = await req.json();

  if (action === 'start') {
    const log = await prisma.callLog.create({
      data: { roomId, callerId, callerName, receiverId, receiverName, status: status || 'initiated' }
    });
    return NextResponse.json({ id: log.id });
  }

  if (action === 'end') {
    // Find the most recent log for this room and update it
    const existing = await prisma.callLog.findFirst({
      where: { roomId },
      orderBy: { startedAt: 'desc' }
    });
    if (existing) {
      await prisma.callLog.update({
        where: { id: existing.id },
        data: { status: status || 'ended', endedAt: new Date(), durationSecs }
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'update_status') {
    const existing = await prisma.callLog.findFirst({
      where: { roomId },
      orderBy: { startedAt: 'desc' }
    });
    if (existing) {
      await prisma.callLog.update({ where: { id: existing.id }, data: { status } });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// Fetch call history (for a specific developer or all)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const developerId = searchParams.get('developerId');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where = developerId
    ? { OR: [{ callerId: developerId }, { receiverId: developerId }] }
    : {};

  const logs = await prisma.callLog.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(logs);
}
