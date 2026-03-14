'use client';

import dynamic from 'next/dynamic';

const DevChatClient = dynamic(() => import('./DevChatClient'), { ssr: false });

export default function DevChatWrapper(props: any) {
  return <DevChatClient {...props} />;
}
