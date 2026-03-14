import { prisma } from '../lib/prisma';
import StatusClient from './StatusClient';
import { getGitCommits } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatusPage() {
  // Fetch initial data
  const logs = await prisma.systemLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const commits = await getGitCommits();

  // Mock health for initial load (actual polling in client)
  const initialHealth = {
    status: 'operational',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: 'connected',
      chat_server: 'running'
    }
  };

  return (
    <StatusClient 
      initialLogs={JSON.parse(JSON.stringify(logs))} 
      initialCommits={commits}
      initialHealth={initialHealth}
    />
  );
}
