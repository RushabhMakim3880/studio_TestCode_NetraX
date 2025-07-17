
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scanPorts, type PortScanResult } from '@/actions/scan-ports-action';
import { Loader2, AlertTriangle, ShieldCheck, ShieldX, Binary } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

const formSchema = z.object({
  target: z.string().min(3, { message: 'Please enter a valid target.' }),
});

const getStatusIcon = (status: 'open' | 'closed') => {
    switch (status) {
        case 'open': return <ShieldCheck className="h-4 w-4 text-green-400" />;
        case 'closed': return <ShieldX className="h-4 w-4 text-destructive" />;
    }
}

export function RealPortScanner() {
  const [results, setResults] = useState<PortScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target: 'scanme.nmap.org',
    },
  });

  const handleProgress = (value: number) => {
    setProgress(value);
  };
  
  const handleResult = (result: PortScanResult) => {
    setResults(prev => [...prev, result].sort((a, b) => a.port - b.port));
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults([]);
    setError(null);
    setProgress(0);
    
    try {
      await scanPorts({
          host: values.target, 
          onProgress: handleProgress,
          onResult: handleResult
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during the scan.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Binary className="h-6 w-6" />
            <CardTitle>Network Port Scanner</CardTitle>
        </div>
        <CardDescription>Perform a live port scan against a target to identify open ports.</CardDescription>
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
                    <Input placeholder="e.g., scanme.nmap.org" {...field} />
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
            {isLoading && (
                 <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Scanning in progress...</span>
                        <span className="font-bold text-lg">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            )}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {results.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Scan Results for {form.getValues('target')}</h3>
                    <div className="border rounded-md max-h-80 overflow-y-auto">
                        <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Port</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>Service</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((portInfo) => (
                                <TableRow key={portInfo.port}>
                                    <TableCell className="font-mono">{portInfo.port}</TableCell>
                                    <TableCell>
                                        <Badge variant={portInfo.status === 'open' ? 'default' : 'outline'} className="capitalize">
                                            {getStatusIcon(portInfo.status)}
                                            {portInfo.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{portInfo.service}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {!isLoading && results.length === 0 && !error && progress === 100 && (
                 <div className="text-center text-muted-foreground py-10">
                    <p>Scan complete. No open ports found in the top 1000.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
