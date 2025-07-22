
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Radar, Clipboard, Trash2, ShieldAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

type HoneytrapHit = {
    timestamp: string; // ISO String
    data: Record<string, any>;
    ip: string;
    userAgent: string;
};

const HONEYTRAP_LOG_KEY = 'netra-honeytrap-log';
const HONEYTRAP_WEBHOOK_ID = 'a7b3c9d1-e5f6-4a8b-9c0d-1f2g3h4j5k6l';

export function WebhookMonitor() {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [hits, setHits] = useState<HoneytrapHit[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWebhookUrl(`${window.location.origin}/api/honeypot/webhook/${HONEYTRAP_WEBHOOK_ID}`);
            loadHits();
        }
    }, []);
    
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === HONEYTRAP_LOG_KEY && event.newValue) {
             try {
                const newHits: HoneytrapHit[] = JSON.parse(event.newValue);
                if (newHits.length > hits.length) {
                    toast({
                        variant: "destructive",
                        title: "Honeytrap Triggered!",
                        description: `A request was captured from IP: ${newHits[0].ip}`,
                    });
                }
                setHits(newHits);
             } catch(e) { console.error("Could not parse honeytrap log", e); }
          }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [hits.length, toast]);

    const loadHits = () => {
        try {
            const storedHits = localStorage.getItem(HONEYTRAP_LOG_KEY);
            setHits(storedHits ? JSON.parse(storedHits) : []);
        } catch(e) {
            console.error("Failed to load honeytrap hits", e);
            setHits([]);
        }
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        toast({ title: 'Webhook URL Copied!'});
    };
    
    const handleClearLog = () => {
        localStorage.removeItem(HONEYTRAP_LOG_KEY);
        setHits([]);
        toast({ title: 'Log Cleared' });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Radar className="h-6 w-6" />
                    <CardTitle>Webhook Monitor &amp; Honey Login Trap</CardTitle>
                </div>
                <CardDescription>
                    Use the unique URL below as a honeypot to detect when your login forms are cloned and used by attackers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Your Unique Honeytrap Webhook URL</Label>
                        <div className="flex items-center gap-2">
                            <Input readOnly value={webhookUrl} className="font-mono bg-primary/20"/>
                            <Button variant="outline" size="icon" onClick={handleCopy}>
                                <Clipboard className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Embed this URL in your real applications. Any data posted here will be logged below.</p>
                    </div>

                    <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <Label>Captured Requests ({hits.length})</Label>
                            {hits.length > 0 && <Button variant="ghost" size="sm" onClick={handleClearLog}><Trash2 className="mr-2 h-4 w-4"/>Clear Log</Button>}
                        </div>
                        <div className="border rounded-md min-h-[20rem] max-h-[30rem] overflow-y-auto p-4 space-y-4 bg-primary/10">
                            {hits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <p>Waiting for requests...</p>
                                </div>
                            ) : (
                                hits.map((hit, i) => (
                                    <div key={i} className="p-3 border bg-card rounded-md">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="h-5 w-5 text-destructive" />
                                                <p className="font-semibold">Honeytrap Hit</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(hit.timestamp), { addSuffix: true })}</p>
                                        </div>
                                         <Badge variant="outline" className="font-mono mb-2">{hit.ip}</Badge>
                                         <pre className="text-xs bg-background p-2 rounded-md overflow-x-auto">
                                            <code>{JSON.stringify(hit.data, null, 2)}</code>
                                         </pre>
                                         <p className="text-xs text-muted-foreground mt-2 truncate"><strong>User Agent:</strong> {hit.userAgent}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
