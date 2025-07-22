
'use client';

import { LiveTracker } from '@/components/live-tracker';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import { Separator } from '@/components/ui/separator';

export default function LiveTrackerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Live Session Tracker</h1>
        <p className="text-muted-foreground">Monitor real-time user interactions from active JavaScript payloads.</p>
      </div>
      
      <LiveTracker />

      <Separator className="my-8" />
      
      <AdvancedPageCloner />

    </div>
  );
}
