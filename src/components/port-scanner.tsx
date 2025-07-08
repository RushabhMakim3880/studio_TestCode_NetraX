'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scanPorts, type PortScanOutput } from '@/ai/flows/port-scanner-flow';
import { Loader2, AlertTriangle, ShieldCheck, ShieldX, ShieldQuestion, Binary } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

const formSchema = z.object({
  target: z.string().min(3, { message: 'Please enter a valid target.' }),
});

const getStatusIcon = (status: 'open' | 'closed' | 'filtered') => {
    switch (status) {
        case 'open': return <ShieldCheck className="h-4 w-4 text-green-400" />;
        case 'closed': return <ShieldX className="h-4 w-4 text-destructive" />;
        case 'filtered': return <ShieldQuestion className="h-4 w-4 text-amber-400" />;
    }
}

export function PortScanner() {
  const [result, setResult] = useState<PortScanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target: '192.168.1.1',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await scanPorts(values);
      setResult(response);
    } catch (err) {
      setError('Failed to run port scan. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Binary className="h-6 w-6" />
            <CardTitle>Port Scanner</CardTitle>
        </div>
        <CardDescription>Simulate a network port scan against a target IP or domain.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target IP or Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 8.8.8.8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scan Ports
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {result && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Scan Results for {form.getValues('target')}</h3>
                    <div className="border rounded-md">
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Port</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Version</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.results.map((portInfo, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-mono">{portInfo.port}/{portInfo.protocol}</TableCell>
                                    <TableCell>
                                        <Badge variant={portInfo.state === 'open' ? 'default' : 'secondary'} className="capitalize">
                                            {getStatusIcon(portInfo.state)}
                                            {portInfo.state}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{portInfo.service}</TableCell>
                                    <TableCell>{portInfo.version || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
