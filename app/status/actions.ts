'use server';

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getGitCommits() {
  try {
    // Format: hash|author|message|timestamp
    const { stdout } = await execAsync('git log -n 15 --pretty=format:"%h|%an|%s|%at"');
    return stdout.split('\n').map(line => {
      const [hash, author, message, timestamp] = line.split('|');
      return {
        hash,
        author,
        message,
        timestamp: parseInt(timestamp) * 1000
      };
    });
  } catch (err) {
    console.error('Failed to fetch git commits:', err);
    return [];
  }
}
