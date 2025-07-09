
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

export type CapturedCredential = {
    username: string;
    password?: string;
    timestamp: number;
};

type CredentialHarvesterProps = {
    credentials: CapturedCredential[];
    onClear: () => void;
};

export function CredentialHarvester({ credentials, onClear }: CredentialHarvesterProps) {
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
                                <TableHead>Username</TableHead>
                                <TableHead>Password</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credentials.slice().reverse().map((cred) => (
                                <TableRow key={cred.timestamp}>
                                    <TableCell>{new Date(cred.timestamp).toLocaleString()}</TableCell>
                                    <TableCell className="font-mono">{cred.username}</TableCell>
                                    <TableCell className="font-mono">{cred.password}</TableCell>
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
                <CardFooter className="border-t pt-6">
                    <Button variant="destructive" onClick={handleClear}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Log
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
