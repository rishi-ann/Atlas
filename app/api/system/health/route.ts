import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: 'connected',
        chat_server: 'running'
      },
      environment: process.env.NODE_ENV
    });
  } catch (err) {
    return NextResponse.json({
      status: 'degraded',
      services: {
        api: 'healthy',
        database: 'error',
        chat_server: 'unknown'
      }
    }, { status: 500 });
  }
}
