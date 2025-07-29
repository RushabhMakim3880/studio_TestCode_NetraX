
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Map } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getGeoIpInfo } from '@/services/ip-geo-service';
import type { TrackedEvent } from '../live-tracker';

type LocationPoint = {
    id: string;
    x: number;
    y: number;
    city: string;
    country: string;
};

export function GlobalThreatMap() {
    const { value: sessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});
    const [locations, setLocations] = useState<LocationPoint[]>([]);
    
    // Base coordinates for the C2 server (e.g., somewhere in central Europe)
    const C2_POINT = { x: 50, y: 50 };

    useEffect(() => {
        const processSessions = async () => {
            const newLocations: LocationPoint[] = [];
            const processedIps = new Set<string>();

            const allIps = Object.values(sessions).flat()
                .filter(event => event.type === 'connection' && event.data?.ipAddress && !processedIps.has(event.data.ipAddress))
                .map(event => event.data.ipAddress);

            for (const ip of allIps) {
                processedIps.add(ip);
                const geo = await getGeoIpInfo(ip);
                if (geo.status === 'success' && geo.lat && geo.lon) {
                    // Convert lat/lon to percentage for positioning on the map
                    const x = (geo.lon + 180) / 360 * 100;
                    const y = (-geo.lat + 90) / 180 * 100;
                    newLocations.push({ id: ip, x, y, city: geo.city || 'Unknown City', country: geo.country || 'Unknown Country' });
                }
            }
            setLocations(newLocations);
        };
        processSessions();
    }, [sessions]);


    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                    <Map />
                    Global Attack Map
                </CardTitle>
                <CardDescription className="text-xs">Visualizes the geographic locations of active victim sessions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="aspect-video w-full bg-primary/30 rounded-lg overflow-hidden relative">
                    {/* Simplified world map background */}
                    <svg viewBox="0 0 1000 500" className="w-full h-full">
                        <path d="M500 0 L500 500 M0 250 L1000 250" stroke="hsl(var(--border))" strokeWidth="0.5"/>
                    </svg>
                    
                    {/* C2 Node */}
                    <div className="absolute w-4 h-4 rounded-full bg-accent/80 border-2 border-accent-foreground shadow-lg" style={{ left: `${C2_POINT.x}%`, top: `${C2_POINT.y}%`, transform: 'translate(-50%, -50%)' }}>
                         <div className="absolute w-4 h-4 rounded-full bg-accent animate-ping"></div>
                    </div>

                    {/* Victim Nodes and Lines */}
                    {locations.map(loc => (
                         <React.Fragment key={loc.id}>
                            <div 
                                className="absolute w-3 h-3 bg-destructive rounded-full" 
                                style={{ left: `${loc.x}%`, top: `${loc.y}%`, transform: 'translate(-50%, -50%)' }}
                                title={`${loc.city}, ${loc.country} (${loc.id})`}
                            />
                            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <line 
                                    x1={`${C2_POINT.x}%`} 
                                    y1={`${C2_POINT.y}%`} 
                                    x2={`${loc.x}%`} 
                                    y2={`${loc.y}%`}
                                    stroke="hsl(var(--destructive) / 0.6)"
                                    strokeWidth="1"
                                    strokeDasharray="4 2"
                                >
                                     <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="15s" repeatCount="indefinite"/>
                                </line>
                            </svg>
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
