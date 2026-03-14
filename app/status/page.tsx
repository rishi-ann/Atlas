import { prisma } from '../lib/prisma';
import StatusClient from './StatusClient';
import { getGitCommits } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatusPage() {
  // Fetch initial logs
  let logs = [];
  try {
    logs = await (prisma as any).atlasLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  } catch (err) {
    console.error('Failed to fetch atlas logs:', err);
  }

  const commits = await getGitCommits();

  // Initial health status
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
