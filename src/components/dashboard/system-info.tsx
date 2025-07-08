
'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';
import { useState, useEffect } from 'react';

export function SystemInfo() {
  const { user } = useAuth();
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setUptime(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');

    return days > 0 ? `${days}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg"><Server />System Info</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Hostname</p>
          <p className="font-mono text-base">netra-x-operator-01</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">User</p>
          <p className="font-mono text-base">{user?.displayName}</p>
        </div>
         <div>
          <p className="text-xs text-muted-foreground">Role</p>
          <p className="font-mono text-base text-accent">{user?.role}</p>
        </div>
         <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Session Uptime</p>
          <p className="font-mono text-base">{formatUptime(uptime)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
