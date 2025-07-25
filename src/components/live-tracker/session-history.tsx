
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { History, Trash2 } from 'lucide-react';
import { TrackedEvent } from '../live-tracker';

type SessionHistoryProps = {
    sessions: Record<string, TrackedEvent[]>;
    setSessions: (sessions: Record<string, TrackedEvent[]>) => void;
    selectedSessionId: string | null;
    setSelectedSessionId: React.Dispatch<React.SetStateAction<string | null>>;
    resetState: () => void;
}

export function SessionHistory({ sessions, setSessions, selectedSessionId, setSelectedSessionId, resetState }: SessionHistoryProps) {
  
  const handleClearHistory = () => {
    setSessions({});
    setSelectedSessionId(null);
    resetState();
  };

  const selectSession = (sessionId: string | null) => {
    resetState();
    setSelectedSessionId(sessionId);
  }

  const sessionMap = new Map(Object.entries(sessions));

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5"/> Session History
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleClearHistory} disabled={sessionMap.size === 0}>
                    <Trash2 className="mr-2 h-4 w-4"/>Clear
                </Button>
            </div>
            <CardDescription>Select a session to interact with.</CardDescription>
        </CardHeader>
        <CardContent>
             <ScrollArea className="h-40">
                <div className="space-y-2 pr-2">
                 {sessionMap.size === 0 ? (
                    <div className="text-center text-muted-foreground pt-10">No active sessions.</div>
                 ) : (
                    Array.from(sessionMap.keys()).map(sessionId => (
                        <Button 
                        key={sessionId} 
                        variant={selectedSessionId === sessionId ? 'secondary' : 'ghost'}
                        className="w-full justify-start font-mono text-xs h-auto py-2"
                        onClick={() => selectSession(sessionId)}
                        >
                        <div className="flex flex-col items-start text-left">
                            <span>{sessionId}</span>
                            <span className="text-muted-foreground font-sans truncate">
                                {sessionMap.get(sessionId)?.[0]?.url.split('//')[1].split('/')[0]}
                            </span>
                        </div>
                        </Button>
                    ))
                 )}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  )
}
