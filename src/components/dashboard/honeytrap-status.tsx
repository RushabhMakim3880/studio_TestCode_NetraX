
'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldCheck, ShieldAlert, BadgeInfo } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type HoneytrapHit = {
    timestamp: string;
    ip: string;
};

export function HoneytrapStatus() {
  const { value: hits } = useLocalStorage<HoneytrapHit[]>('netra-honeytrap-log', []);
  const latestHit = hits?.[0];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
            {latestHit ? <ShieldAlert className="text-destructive"/> : <ShieldCheck className="text-green-400" />}
            Honeytrap Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center h-full">
        {latestHit ? (
            <div className="space-y-2">
                <p className="text-2xl font-bold text-destructive">Trap Triggered!</p>
                <p className="text-sm text-muted-foreground">
                    Last hit from <span className="font-mono text-accent">{latestHit.ip}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(latestHit.timestamp), { addSuffix: true })}
                </p>
            </div>
        ) : (
             <div className="space-y-2">
                <p className="text-2xl font-bold text-green-400">All Quiet</p>
                <p className="text-sm text-muted-foreground">No suspicious activity detected on honeypots.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
