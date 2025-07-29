
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Code2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

const generateRandomLog = (credentials: any[], sessions: any) => {
    const logTypes = ['keystroke', 'click', 'form-submit', 'connection'];
    const randomType = logTypes[Math.floor(Math.random() * logTypes.length)];
    const time = new Date().toLocaleTimeString();

    switch(randomType) {
        case 'keystroke':
            const char = String.fromCharCode(97 + Math.floor(Math.random() * 26));
            return `[${time}] KEYPRESS: ${char}`;
        case 'click':
            const x = Math.floor(Math.random() * 1920);
            const y = Math.floor(Math.random() * 1080);
            return `[${time}] CLICK: Pos(${x},${y})`;
        case 'form-submit':
            if (credentials.length > 0) {
                 const randomCred = credentials[Math.floor(Math.random() * credentials.length)];
                 const userField = Object.keys(randomCred).find(k => k.includes('user') || k.includes('email'));
                 return `[${time}] SUBMIT: User:'${randomCred[userField || 'username']}' Pass:'**********'`;
            }
            return `[${time}] SUBMIT: user:test pass:****`;
        case 'connection':
             const sessionIds = Object.keys(sessions);
             if (sessionIds.length > 0) {
                 const randomId = sessionIds[Math.floor(Math.random() * sessionIds.length)];
                 return `[${time}] CONNECT: New session ${randomId.substring(0,8)}...`;
             }
             return `[${time}] CONNECT: New session established.`;
        default:
             return `[${time}] SYSTEM: Idle...`;
    }
}


export function OnTheWireFeed() {
    const [logs, setLogs] = useState<string[]>([]);
    const { value: credentials } = useLocalStorage<any[]>('netra-captured-credentials', []);
    const { value: sessions } = useLocalStorage<Record<string, any[]>>('netra-sessions', {});
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setLogs(prev => {
                const newLog = generateRandomLog(credentials, sessions);
                const newLogs = [...prev, newLog];
                return newLogs.slice(-100); // Keep last 100 logs
            });
        }, 800 + Math.random() * 1000);

        return () => clearInterval(interval);
    }, [credentials, sessions]);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                    <Code2 />
                    "On The Wire" Feed (Simulated)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div ref={scrollAreaRef} className="h-48 bg-black text-green-400 font-mono text-xs rounded-md p-2 overflow-y-auto">
                    {logs.map((log, index) => (
                        <p key={index} className="animate-in fade-in">{log}</p>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
