
'use client';

import { EmailOutbox } from '@/components/email-outbox';

export default function EmailOutboxPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Email Outbox</h1>
        <p className="text-muted-foreground">Monitor all outgoing email communications from the platform.</p>
      </div>

      <EmailOutbox />
    </div>
  );
}
