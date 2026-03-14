import { cookies } from 'next/headers';
import { prisma } from '../../lib/prisma';
import DeliverablesManager from './DeliverablesManager';

export default async function ClientFilesPage() {
  const cookieStore = await cookies();
  const clientToken = cookieStore.get('client_token');

  if (!clientToken || !clientToken.value) return null;

  const clientWithDeliverables = await prisma.client.findUnique({
    where: { id: clientToken.value },
    include: {
      deliverables: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const deliverables = clientWithDeliverables?.deliverables || [];

  return <DeliverablesManager initialDeliverables={deliverables} />;
}
