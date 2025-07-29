
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

type TrafficData = {
    time: string;
    sent: number;
    received: number;
};

// Generate more realistic, fluctuating data
const generateRandomDataPoint = (lastSent: number, lastReceived: number) => {
    const sentChange = (Math.random() - 0.4) * 20 + 2; // Tend to have some base traffic
    const receivedChange = (Math.random() - 0.5) * 5 + 0.5;
    return {
        sent: Math.max(0, lastSent + sentChange),
        received: Math.max(0, lastReceived + receivedChange),
    };
};

export function C2TrafficMonitor() {
    const [data, setData] = useState<TrafficData[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prevData => {
                const now = new Date();
                const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                
                const lastPoint = prevData[prevData.length - 1] || { sent: 10, received: 2 };
                const newDataPoint = generateRandomDataPoint(lastPoint.sent, lastPoint.received);

                const newChartData = [...prevData, { time, ...newDataPoint }];
                
                // Keep only the last 30 data points
                return newChartData.slice(-30);
            });
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, []);

    const totalSent = data.reduce((acc, item) => acc + item.sent, 0);
    const totalReceived = data.reduce((acc, item) => acc + item.received, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                    <Activity />
                    C2 Traffic Monitor (Simulated)
                </CardTitle>
                 <div className="text-sm text-muted-foreground flex justify-between">
                    <span>Total Sent: {(totalSent / 1024).toFixed(2)} KB</span>
                    <span>Total Received: {(totalReceived / 1024).toFixed(2)} KB</span>
                </div>
            </CardHeader>
            <CardContent className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={(val) => `${val} B`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false}/>
                        <Tooltip
                          contentStyle={{
                              background: 'hsl(var(--background))',
                              borderColor: 'hsl(var(--border))',
                              fontSize: '12px',
                          }}
                          labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="sent" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorSent)" />
                        <Area type="monotone" dataKey="received" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorReceived)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
