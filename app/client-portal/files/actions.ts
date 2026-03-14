'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function uploadDeliverable(formData: FormData) {
  const cookieStore = await cookies();
  const clientToken = cookieStore.get('client_token');

  if (!clientToken || !clientToken.value) {
    return { error: 'Not authenticated' };
  }

  const title = formData.get('title')?.toString();
  const fileUrl = formData.get('fileUrl')?.toString();
  const fileType = formData.get('fileType')?.toString();
  const fileName = formData.get('fileName')?.toString();
  const fileSize = formData.get('fileSize')?.toString();

  if (!title || !fileUrl || !fileType || !fileName) {
    return { error: 'Missing required file data' };
  }

  try {
    await prisma.deliverable.create({
      data: {
        title,
        fileUrl,
        fileType,
        fileName,
        fileSize,
        clientId: clientToken.value
      }
    });

    revalidatePath('/client-portal/files');
    return { success: true };
  } catch (error) {
    console.error('Failed to upload deliverable:', error);
    return { error: 'Internal server error' };
  }
}
