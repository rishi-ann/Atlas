'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createClient(formData: FormData) {
  const cookieStore = await cookies();
  const superToken = cookieStore.get('super_admin_token');

  if (!superToken || superToken.value !== 'true') return { error: 'Not authenticated' };

  const name = formData.get('name')?.toString();
  const email = formData.get('email')?.toString();
  const company = formData.get('company')?.toString() || null;
  const companyType = formData.get('companyType')?.toString() || null;
  const authorizedName = formData.get('authorizedName')?.toString() || null;
  const phone = formData.get('phone')?.toString() || null;
  const address = formData.get('address')?.toString() || null;
  const developerId = formData.get('developerId')?.toString() || null;

  if (!name || !email) return { error: 'Name and email are required' };

  // Generate unique RED-XXXX ID
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const clientRef = `RED-${randomId}`;

  try {
    await prisma.client.create({
      data: {
        clientRef,
        name,
        email,
        company,
        companyType,
        authorizedName,
        phone,
        address,
        developerId: developerId || null,
      }
    });
    revalidatePath('/super-admin/clients');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to provision client:', err);
    return { error: 'Failed to create client.' };
  }
}

export async function deleteClient(clientId: string) {
  const cookieStore = await cookies();
  const superToken = cookieStore.get('super_admin_token');

  if (!superToken || superToken.value !== 'true') return { error: 'Not authenticated' };

  try {
    await prisma.client.delete({
      where: { id: clientId }
    });
    revalidatePath('/super-admin/clients');
    return { success: true };
  } catch (err: any) {
    return { error: 'Failed to delete client.' };
  }
}
