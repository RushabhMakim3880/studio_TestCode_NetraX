
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { intelxSearch, type IntelxSearchResult } from '@/ai/flows/intelx-search-flow';
import { Loader2, AlertTriangle, LifeBuoy, ServerCrash } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

const formSchema = z.object({
  term: z.string().min(3, { message: 'Please enter a valid search term.' }),
});

const getBucketBadgeVariant = (bucket: string): 'destructive' | 'secondary' | 'outline' => {
    if (bucket?.includes('leaks')) return 'destructive';
    if (bucket?.includes('darknet')) return 'secondary';
    return 'outline';
}

export function DarkWebScanner() {
  const [results, setResults] = useState<IntelxSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term: 'example.com',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults([]);
    setError(null);
    try {
      const response = await intelxSearch(values.term);
      if(response.success && response.results) {
        setResults(response.results);
      } else {
        setError(response.error || 'An unknown error occurred.');
      }
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
            <LifeBuoy className="h-6 w-6" />
            <CardTitle>Dark Web & Data Breach Scanner</CardTitle>
        </div>
        <CardDescription>Search domains or emails against the IntelX.io intelligence database.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormLabel>Search Term (Domain, Email, etc.)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md"><ServerCrash className="h-4 w-4" />{error}</div>}
            
            {results.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Search Results ({results.length})</h3>
                    <div className="border rounded-md max-h-96 overflow-y-auto">
                        <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Source</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((res) => (
                                <TableRow key={res.systemid}>
                                    <TableCell>
                                       <Badge variant={getBucketBadgeVariant(res.bucket)}>{res.bucket}</Badge>
                                    </TableCell>
                                    <TableCell>{res.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{new Date(res.date).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                </div>
            )}
             {!isLoading && !error && results.length === 0 && form.formState.isSubmitted && (
                <div className="text-center text-muted-foreground py-10">No results found for this term.</div>
             )}
        </div>
      </CardContent>
    </Card>
  );
}
