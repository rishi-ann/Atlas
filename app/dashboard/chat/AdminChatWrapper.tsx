'use client';

import dynamic from 'next/dynamic';

const AdminChatClient = dynamic(() => import('./AdminChatClient'), { ssr: false });

export default function AdminChatWrapper(props: any) {
  return <AdminChatClient {...props} />;
}
