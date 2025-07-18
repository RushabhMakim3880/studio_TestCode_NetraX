'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { whoisLookup } from '@/actions/osint-actions';
import { Loader2, AlertTriangle, Fingerprint } from 'lucide-react';

const formSchema = z.object({
  domain: z.string().min(3, { message: 'Please enter a valid domain name.' }),
});

export function WhoisLookup() {
  const [result, setResult] = useState<string | null>(null);
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
    setResult(null);
    setError(null);
    try {
      const response = await whoisLookup(values.domain);
      setResult(response);
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
          <Fingerprint className="h-6 w-6" />
          <CardTitle>Whois Lookup</CardTitle>
        </div>
        <CardDescription>Retrieve domain registration information.</CardDescription>
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
              Lookup
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
          {result && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Whois Record</h3>
              <pre className="bg-primary/20 p-4 rounded-md text-sm text-foreground overflow-x-auto font-mono max-h-96">
                <code>{result}</code>
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
