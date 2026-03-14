'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createClient(formData: FormData) {
  const cookieStore = await cookies();
  const superToken = cookieStore.get('super_admin_token');

  if (!superToken || superToken.value !== 'true') return { error: 'Not authenticated' };

  const name = formData.get('name')?.toString();
  const emails = formData.getAll('emails').map(e => e.toString()).filter(Boolean);
  const phones = formData.getAll('phones').map(p => p.toString()).filter(Boolean);
  const company = formData.get('company')?.toString() || null;
  const companyType = formData.get('companyType')?.toString() || null;
  const description = formData.get('description')?.toString() || null;
  const authorizedName = formData.get('authorizedName')?.toString() || null;
  const address = formData.get('address')?.toString() || null;
  const developerId = formData.get('developerId')?.toString() || null;

  if (!name || emails.length === 0) return { error: 'Name and at least one email are required' };

  // Generate unique RED-XXXX ID
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const clientRef = `RED-${randomId}`;

  try {
    await prisma.client.create({
      data: {
        clientRef,
        name,
        emails,
        phones,
        company,
        description,
        companyType,
        authorizedName,
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

export async function updateClient(clientId: string, formData: FormData) {
  const cookieStore = await cookies();
  const superToken = cookieStore.get('super_admin_token');

  if (!superToken || superToken.value !== 'true') return { error: 'Not authenticated' };

  const name = formData.get('name')?.toString();
  const emails = formData.getAll('emails').map(e => e.toString()).filter(Boolean);
  const phones = formData.getAll('phones').map(p => p.toString()).filter(Boolean);
  const company = formData.get('company')?.toString() || null;
  const companyType = formData.get('companyType')?.toString() || null;
  const description = formData.get('description')?.toString() || null;
  const authorizedName = formData.get('authorizedName')?.toString() || null;
  const address = formData.get('address')?.toString() || null;
  const developerId = formData.get('developerId')?.toString() || null;

  if (!name || emails.length === 0) return { error: 'Name and at least one email are required' };

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        emails,
        phones,
        company,
        description,
        companyType,
        authorizedName,
        address,
        developerId: developerId || null,
      }
    });
    revalidatePath('/super-admin/clients');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update client:', err);
    return { error: 'Failed to update client.' };
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
