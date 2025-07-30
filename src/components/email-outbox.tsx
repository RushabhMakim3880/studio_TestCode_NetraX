
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Mailbox, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';

export type SentEmail = {
    id: string;
    recipient: string;
    subject: string;
    timestamp: string;
    status: 'Sent' | 'Failed';
};

export function EmailOutbox() {
    const { value: sentEmails, setValue: setSentEmails } = useLocalStorage<SentEmail[]>('netra-email-outbox', []);
    const { toast } = useToast();
    
    const handleClearOutbox = () => {
        setSentEmails([]);
        toast({ title: "Outbox Cleared" });
    }

    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Mailbox className="h-6 w-6" />
                        <CardTitle>Email Outbox</CardTitle>
                    </div>
                     <Button variant="ghost" size="sm" onClick={handleClearOutbox} disabled={sentEmails.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4"/>Clear Log
                    </Button>
                </div>
                <CardDescription>A log of all phishing emails sent from the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96 w-full">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-right">Sent</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sentEmails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No emails sent yet.</TableCell>
                                </TableRow>
                            ) : (
                                sentEmails.map(email => (
                                    <TableRow key={email.id}>
                                        <TableCell>{email.recipient}</TableCell>
                                        <TableCell className="truncate max-w-xs">{email.subject}</TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">{formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
