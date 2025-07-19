
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scanForIdor, type IdorScanResult } from '@/actions/idor-scan-action';
import { Loader2, AlertTriangle, Target, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

const formSchema = z.object({
  urlTemplate: z.string().url().refine(val => val.includes('{ID}'), {
    message: "URL must contain the placeholder '{ID}'.",
  }),
  startId: z.coerce.number().min(0),
  endId: z.coerce.number().min(1),
}).refine(data => data.endId > data.startId, {
    message: "End ID must be greater than Start ID.",
    path: ["endId"],
});

const getStatusColor = (status: number): 'destructive' | 'secondary' | 'default' | 'outline' => {
  if (status >= 500) return 'destructive';
  if (status >= 400) return 'secondary';
  if (status >= 300) return 'default';
  if (status >= 200) return 'default';
  return 'outline';
};

export function IdorScanner() {
  const [results, setResults] = useState<IdorScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urlTemplate: 'https://jsonplaceholder.typicode.com/posts/{ID}',
      startId: 1,
      endId: 10,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults([]);
    setError(null);
    try {
      const response = await scanForIdor({
        urlTemplate: values.urlTemplate,
        start: values.startId,
        end: values.endId,
      });
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during the scan.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Target className="h-6 w-6" />
            <CardTitle>IDOR Scanner</CardTitle>
        </div>
        <CardDescription>Test for Insecure Direct Object Reference vulnerabilities by iterating through numeric IDs in a URL.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="urlTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Template</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., https://api.example.com/users/{ID}" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="startId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start ID</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="endId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End ID</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scan IDs
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {results.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Scan Results</h3>
                    <div className="border rounded-md max-h-96 overflow-y-auto">
                        <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Status Code</TableHead>
                                <TableHead>Content Length</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((res) => (
                                <TableRow key={res.id}>
                                    <TableCell className="font-mono">{res.id}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(res.status)}>
                                            {res.status > 0 ? res.status : 'Error'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{res.length > 0 ? `${res.length} bytes` : '-'}</TableCell>
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
