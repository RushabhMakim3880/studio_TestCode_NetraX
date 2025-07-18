'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scanSubdomains } from '@/actions/osint-actions';
import { Loader2, AlertTriangle, Globe2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  domain: z.string().min(3, { message: 'Please enter a valid domain name.' }),
});

export function SubdomainScanner() {
  const [results, setResults] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: 'google.com',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults(null);
    setError(null);
    try {
      const response = await scanSubdomains(values.domain);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Globe2 className="h-6 w-6" />
          <CardTitle>Subdomain Scanner</CardTitle>
        </div>
        <CardDescription>Find subdomains for a given domain using a public API.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormLabel>Domain Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scan
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
          {results && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Found {results.length} Subdomains</h3>
               <ScrollArea className="h-72 w-full">
                <div className="flex flex-wrap gap-2 p-1">
                    {results.length > 0 ? results.map((subdomain) => (
                        <Badge key={subdomain} variant="secondary" className="font-mono">{subdomain}</Badge>
                    )) : (
                        <p className="text-center text-muted-foreground w-full pt-8">No subdomains found.</p>
                    )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
