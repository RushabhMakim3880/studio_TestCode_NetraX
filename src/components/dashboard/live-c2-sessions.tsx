
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Radio, ServerCrash } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { TrackedEvent } from '../live-tracker';

export function LiveC2Sessions() {
  const { value: sessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});
  const activeSessions = Object.entries(sessions);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
            <Radio className="text-accent animate-pulse"/>
            Live C2 Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeSessions.length > 0 ? (
            activeSessions.map(([id, events]) => {
                const lastEvent = events[events.length -1];
                return (
                     <div key={id} className="text-xs p-2 bg-primary/20 rounded-md">
                        <p className="font-mono truncate text-sm">{id}</p>
                        <p className="text-muted-foreground truncate">{lastEvent.url}</p>
                     </div>
                )
            })
        ) : (
            <div className="text-center text-muted-foreground py-6">
                <ServerCrash className="mx-auto h-8 w-8 mb-2"/>
                No active C2 sessions.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
