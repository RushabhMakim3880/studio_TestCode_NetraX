
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Globe, Timer, ArrowDown, ArrowUp, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';

type NetworkState = {
    isOnline: boolean;
    ip: string | null;
    ping: number | null;
    downloadSpeed: number;
    uploadSpeed: number;
};

export function NetworkStatus() {
  const [status, setStatus] = useState<NetworkState>({
    isOnline: true,
    ip: null,
    ping: null,
    downloadSpeed: 0,
    uploadSpeed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkStatus = async () => {
       try {
        const startTime = Date.now();
        // Use a cache-busting query parameter
        const response = await fetch(`https://api.ipify.org?format=json&cb=${new Date().getTime()}`, { cache: 'no-store' });
        const endTime = Date.now();
        
        if (!response.ok) throw new Error('Failed to fetch IP');
        
        const data = await response.json();
        
        setStatus(prev => ({
            ...prev,
            isOnline: true,
            ip: data.ip,
            ping: endTime - startTime,
        }));

      } catch (error) {
        console.error("Network check failed:", error);
        let errorMessage = "Network check failed";
        // A TypeError during a fetch is often due to a browser extension (like an ad-blocker) interfering.
        if (error instanceof TypeError) {
            errorMessage = "Blocked by extension";
        }
        setStatus(prev => ({ ...prev, isOnline: false, ip: errorMessage, ping: null }));
      } finally {
        setIsLoading(false);
      }
    };
    
    // Simulate changing network speeds
    const simulateSpeeds = () => {
        setStatus(prev => ({
            ...prev,
            downloadSpeed: Math.random() * (100 - 10) + 10, // Random speed between 10 and 100 Mbps
            uploadSpeed: Math.random() * (50 - 5) + 5, // Random speed between 5 and 50 Mbps
        }));
    };

    fetchNetworkStatus();
    simulateSpeeds();

    const interval = setInterval(() => {
        fetchNetworkStatus();
        simulateSpeeds();
    }, 5000); // Re-check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getPingColor = (ping: number | null) => {
    if (ping === null) return 'bg-gray-400';
    if (ping < 100) return 'bg-green-400';
    if (ping < 300) return 'bg-amber-400';
    return 'bg-red-400';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
            {status.isOnline ? <Wifi /> : <WifiOff />}
            Network Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground gap-2">
                 <Loader2 className="h-5 w-5 animate-spin" />
            </div>
        ) : (
            <>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Public IP Address</p>
                        <p className="font-mono text-base">{status.ip || 'N/A'}</p>
                    </div>
                     <Badge variant={status.isOnline ? 'default' : 'destructive'} className={status.isOnline ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                        {status.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                </div>
                 <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Timer className="h-3 w-3" /> Ping</p>
                        <p className="font-mono text-base">{status.ping !== null ? `${status.ping}ms` : 'N/A'}</p>
                        <div className="flex justify-center mt-1"><span className={`h-1.5 w-8 rounded-full ${getPingColor(status.ping)}`}></span></div>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ArrowDown className="h-3 w-3" /> Download</p>
                        <p className="font-mono text-base">{status.downloadSpeed.toFixed(1)} <span className="text-xs">Mbps</span></p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ArrowUp className="h-3 w-3" /> Upload</p>
                        <p className="font-mono text-base">{status.uploadSpeed.toFixed(1)} <span className="text-xs">Mbps</span></p>
                    </div>
                 </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}
