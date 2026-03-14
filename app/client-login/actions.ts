'use server';

import { prisma } from '../lib/prisma';
import { cookies } from 'next/headers';

export async function clientLogin(formData: FormData) {
  const clientId = formData.get('clientId') as string;

  if (!clientId) {
    return { error: 'Client ID is required' };
  }

  try {
    const client = await prisma.client.findUnique({
      where: { clientRef: clientId },
    });

    if (!client) {
      return { error: 'Invalid ID. Ensure it follows the RED-XXXX format (e.g., RED-9482).' };
    }

    const cookieStore = await cookies();
    cookieStore.set('client_token', client.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return { success: true };
  } catch (err) {
    console.error('Client login error:', err);
    return { error: 'An unexpected error occurred during login.' };
  }
}

export async function logoutClient() {
  const cookieStore = await cookies();
  cookieStore.delete('client_token');
}
