'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scanFileHash, type VirusTotalScanOutput } from '@/ai/flows/virustotal-scan-flow';
import { Loader2, AlertTriangle, Search, CheckCircle, ShieldAlert, ShieldX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formSchema = z.object({
  hash: z.string().min(32, { message: 'Please enter a valid file hash (MD5, SHA1, or SHA256).' }),
});

const getDetectionIcon = (category: string) => {
    switch(category) {
        case 'malicious': return <ShieldX className="h-4 w-4 text-destructive" />;
        case 'suspicious': return <ShieldAlert className="h-4 w-4 text-amber-400" />;
        default: return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
}

export function VirusTotalScanner() {
  const [result, setResult] = useState<VirusTotalScanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hash: 'e88219c40953a2341e05391512359052', // a plausible MD5 hash
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await scanFileHash(values);
      setResult(response);
    } catch (err) {
      setError('Failed to fetch scan results. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>VirusTotal Hash Scanner</CardTitle>
        <CardDescription>Check a file hash against the simulated VirusTotal database.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="hash"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormLabel>File Hash</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter MD5, SHA1, or SHA256 hash..." {...field} className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Scan Hash
            </Button>
          </form>
        </Form>
        
        {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}

        {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {result && (
            <div className="space-y-4 pt-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Detection Ratio</span>
                        <span className={`font-bold text-lg ${result.positives > 0 ? 'text-destructive' : 'text-green-400'}`}>
                            {result.positives} / {result.total}
                        </span>
                    </div>
                    <Progress value={(result.positives / result.total) * 100} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">Scan Date: {new Date(result.scanDate).toLocaleString()}</p>
                </div>

                <div className="max-h-80 overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Engine</TableHead>
                                <TableHead>Result</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.results.map((res, i) => (
                                <TableRow key={i}>
                                    <TableCell>{res.engineName}</TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        {getDetectionIcon(res.category)}
                                        <span className={res.result ? 'text-destructive font-mono' : 'text-muted-foreground'}>
                                            {res.result || 'Undetected'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
