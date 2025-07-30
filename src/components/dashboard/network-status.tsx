
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Timer, Wifi, WifiOff, Globe, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { getGeoIpInfo, type GeoIpInfo } from '@/services/ip-geo-service';


type NetworkState = {
    isOnline: boolean;
    ip: string | null;
    ping: number | null;
    geo: GeoIpInfo | null;
};

export function NetworkStatus() {
  const [status, setStatus] = useState<NetworkState>({
    isOnline: true,
    ip: null,
    ping: null,
    geo: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkStatus = async () => {
       try {
        const startTime = Date.now();
        // Use a more robust API endpoint less likely to be blocked
        const ipResponse = await fetch(`https://1.1.1.1/cdn-cgi/trace`, {
            cache: 'no-store',
            method: 'GET',
            headers: { 'Accept': 'text/plain' },
        });
        const endTime = Date.now();
        
        if (!ipResponse.ok) throw new Error('Failed to fetch IP');
        
        const traceText = await ipResponse.text();
        const ipLine = traceText.split('\n').find(line => line.startsWith('ip='));
        const ip = ipLine ? ipLine.split('=')[1] : 'Unknown';

        const geoData = await getGeoIpInfo(ip);
        
        setStatus(prev => ({
            ...prev,
            isOnline: true,
            ip: ip,
            ping: endTime - startTime,
            geo: geoData.status === 'success' ? geoData : null,
        }));

      } catch (error) {
        console.error("Network check failed:", error);
        let errorMessage = "Network check failed";
        if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMessage = "Blocked by extension or CORS";
        }
        setStatus(prev => ({ ...prev, isOnline: false, ip: errorMessage, ping: null, geo: null }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkStatus();
    const interval = setInterval(fetchNetworkStatus, 30000); // Re-check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getPingColor = (ping: number | null) => {
    if (ping === null) return 'bg-gray-400';
    if (ping < 100) return 'bg-green-400';
    if (ping < 300) return 'bg-amber-400';
    return 'bg-red-400';
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg"><Wifi /> Network Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        {isLoading ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground gap-2">
                 <Loader2 className="h-5 w-5 animate-spin" />
            </div>
        ) : (
            <>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={status.isOnline ? 'default' : 'destructive'} className={status.isOnline ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                        {status.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                </div>
                 <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Public IP Address</p>
                    <p className="font-mono text-sm">{status.ip || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-mono text-sm">{status.geo ? `${status.geo.city}, ${status.geo.country}` : 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Latency</p>
                     <div className="flex items-center gap-2">
                        <div className={`h-2 w-4 rounded-full ${getPingColor(status.ping)}`}></div>
                        <p className="font-mono text-sm">{status.ping !== null ? `${status.ping}ms` : 'N/A'}</p>
                    </div>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}
