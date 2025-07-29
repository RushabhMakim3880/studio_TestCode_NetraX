
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg"><Server />System Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Hostname</p>
          <p className="font-mono text-sm">netra-x-operator-01</p>
        </div>
         <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">User</p>
          <p className="font-mono text-sm">{user?.displayName}</p>
        </div>
         <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Role</p>
          <p className="font-mono text-sm text-accent">{user?.role}</p>
        </div>
         <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Session Uptime</p>
          <p className="font-mono text-sm">{formatUptime(uptime)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
