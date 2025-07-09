
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ShieldAlert, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

export type CapturedCredential = {
    timestamp: number;
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
                {credentials.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead colSpan={2}>Captured Data</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credentials.slice().reverse().map((cred, index) => (
                                <TableRow key={cred.timestamp + index}>
                                    <TableCell>{new Date(cred.timestamp).toLocaleString()}</TableCell>
                                    <TableCell colSpan={2}>
                                        <div className="font-mono text-xs space-y-1">
                                            {Object.entries(cred).map(([key, value]) => {
                                                if (key === 'timestamp') return null;
                                                return (
                                                    <div key={key} className="truncate">
                                                        <span className="text-muted-foreground">{key}: </span>
                                                        <span className="text-foreground">{String(value)}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-10 h-full flex items-center justify-center">
                        <p>No credentials captured yet.</p>
                    </div>
                )}
            </CardContent>
            {credentials.length > 0 && (
                <CardFooter className="border-t pt-6 justify-between">
                    <Button variant="outline" onClick={onRefresh}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Log
                    </Button>
                    <Button variant="destructive" onClick={handleClear}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Log
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
