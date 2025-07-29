
'use client';

import { ChatClient } from '@/components/chat-client';

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-shrink-0">
        <h1 className="font-headline text-3xl font-semibold">Communication Channel</h1>
        <p className="text-muted-foreground">Secure real-time chat for operational coordination.</p>
      </div>
      <ChatClient />
    </div>
  );
}
