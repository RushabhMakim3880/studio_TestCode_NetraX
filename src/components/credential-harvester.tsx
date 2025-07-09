
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                    <CardTitle>Simulated Credential Harvester</CardTitle>
                </div>
                <CardDescription>
                    Credentials captured from the cloned login page are displayed here. This is for simulation only.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                            {credentials.map((cred) => (
                                <TableRow key={cred.timestamp}>
                                    <TableCell>{new Date(cred.timestamp).toLocaleString()}</TableCell>
                                    <TableCell className="font-mono">{cred.username}</TableCell>
                                    <TableCell className="font-mono">{cred.password}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        No credentials captured yet.
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
