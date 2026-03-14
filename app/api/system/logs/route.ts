import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  
  try {
    const logs = await (prisma as any).atlasLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_API_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const log = await (prisma as any).atlasLog.create({
      data: {
        level: body.level || 'info',
        category: body.category,
        message: body.message,
        metadata: body.metadata || {},
      },
    });
    return NextResponse.json(log);
  } catch (error) {
    console.error('Log creation error:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
