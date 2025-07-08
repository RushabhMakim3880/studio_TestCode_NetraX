'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Wifi } from 'lucide-react';

export function NetworkInfo() {
  const [networkStats, setNetworkStats] = useState({
    localIp: '192.168.1.107',
    externalIp: '104.28.17.145', // simulated
    download: 0,
    upload: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStats(prev => ({
        ...prev,
        download: 85 + Math.random() * 20, // 85-105 Mbps
        upload: 8 + Math.random() * 4,    // 8-12 Mbps
      }));
    }, 2000);
    // Set initial value
    setNetworkStats(prev => ({ ...prev, download: 85 + Math.random() * 20, upload: 8 + Math.random() * 4 }));
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg"><Wifi />Network Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Internal IP</p>
          <p className="font-mono text-base">{networkStats.localIp}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">External IP</p>
          <p className="font-mono text-base">{networkStats.externalIp}</p>
        </div>
        <div className="flex justify-around pt-2 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ArrowDown className="text-green-400" /> DOWNLOAD</p>
            <p className="font-mono text-lg">{networkStats.download.toFixed(2)} <span className="text-sm text-muted-foreground">Mbps</span></p>
          </div>
           <div className="text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ArrowUp className="text-sky-400" /> UPLOAD</p>
            <p className="font-mono text-lg">{networkStats.upload.toFixed(2)} <span className="text-sm text-muted-foreground">Mbps</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
