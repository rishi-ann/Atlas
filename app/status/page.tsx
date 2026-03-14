import StatusClient from './StatusClient';
import { getGitCommits } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatusPage() {
  const commits = await getGitCommits();

  return (
    <StatusClient 
      initialLogs={[]} 
      initialCommits={commits}
      initialHealth={null}
    />
  );
}
