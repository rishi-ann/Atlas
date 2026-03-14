'use server';

import { prisma } from '../lib/prisma';
import { cookies } from 'next/headers';

export async function submitDevApplication(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const reason = formData.get('reason') as string;

    if (!name || !email || !reason) {
      return { error: 'All fields are strictly required.' };
    }

    await prisma.developer.create({
      data: {
        name,
        email,
        reason,
        status: 'pending',
      }
    });

    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'A developer with this email has already applied.' };
    }
    return { error: 'Failed to submit application. Please try again.' };
  }
}

export async function devLogin(formData: FormData) {
  try {
    const email = formData.get('email') as string;

    if (!email) {
      return { error: 'Email address is required.' };
    }

    const dev = await prisma.developer.findUnique({
      where: { email }
    });

    if (!dev) {
      return { error: 'No developer account found with this email.' };
    }

    if (dev.status === 'pending') {
      return { error: 'Your account is currently under review by the Admins. Please check back later.' };
    }

    if (dev.status === 'rejected') {
      return { error: 'Your developer application was denied by the Admin.' };
    }

    if (dev.status === 'approved') {
      // Update lastSeenAt to now
      await prisma.developer.update({
        where: { id: dev.id },
        data: { lastSeenAt: new Date() }
      });

      // Set secure HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set('dev_token', dev.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return { success: true };
    }

  } catch (error) {
    return { error: 'Login verification failed.' };
  }
}
