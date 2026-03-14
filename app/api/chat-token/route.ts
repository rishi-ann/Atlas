import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.CHAT_JWT_SECRET || 'atlas-dev-chat-secret-2025';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const devToken = cookieStore.get('dev_token');

  if (!devToken || !devToken.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Fetch the developer from DB
  const developer = await prisma.developer.findUnique({
    where: { id: devToken.value },
    select: { id: true, name: true, email: true, status: true }
  });

  if (!developer || developer.status !== 'approved') {
    return NextResponse.json({ error: 'Developer not found or not approved' }, { status: 403 });
  }

  // Issue a short-lived JWT for the chat server
  const token = jwt.sign(
    { id: developer.id, name: developer.name, email: developer.email },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  return NextResponse.json({ token, developer });
}
