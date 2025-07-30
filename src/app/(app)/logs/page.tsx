
'use client';

import { ActivityFeed } from '@/components/activity-feed';

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Activity Log</h1>
        <p className="text-muted-foreground">A centralized log of all significant user actions across the platform.</p>
      </div>
      <ActivityFeed />
    </div>
  );
}
