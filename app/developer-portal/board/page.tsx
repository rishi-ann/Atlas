import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import KanbanClient from './KanbanClient';

export default async function KanbanBoardPage() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get('dev_token');

  if (!devToken || !devToken.value) {
    redirect('/dev-login');
  }

  // Fetch all tasks for this specific developer securely on server
  const tasks = await prisma.task.findMany({
    where: { developerId: devToken.value },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <KanbanClient initialTasks={tasks} token={devToken.value} />
  );
}
