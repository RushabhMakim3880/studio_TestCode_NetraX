'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Search } from 'lucide-react';
import { Label } from './ui/label';

const dorkSchema = z.object({
  query: z.string().optional(),
  hostname: z.string().optional(),
  org: z.string().optional(),
  port: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

type DorkFormValues = z.infer<typeof dorkSchema>;

export function ShodanDorkGenerator() {
  const { toast } = useToast();
  const [generatedDork, setGeneratedDork] = useState('');

  const form = useForm<DorkFormValues>({
    resolver: zodResolver(dorkSchema),
    defaultValues: {
      query: '',
      hostname: '',
      org: '',
      port: '',
      country: '',
      city: '',
    },
  });

  const onSubmit = (values: DorkFormValues) => {
    const parts = [];
    if (values.query) parts.push(values.query);
    if (values.hostname) parts.push(`hostname:${values.hostname}`);
    if (values.org) parts.push(`org:"${values.org}"`);
    if (values.port) parts.push(`port:${values.port}`);
    if (values.country) parts.push(`country:"${values.country.toUpperCase()}"`);
    if (values.city) parts.push(`city:"${values.city}"`);

    const dork = parts.join(' ');
    setGeneratedDork(dork);
  };

  const copyToClipboard = () => {
    if (generatedDork) {
      navigator.clipboard.writeText(generatedDork);
      toast({
        title: 'Copied!',
        description: 'Shodan dork copied to clipboard.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shodan Dork Generator</CardTitle>
        <CardDescription>
          Craft advanced Shodan queries to find specific internet-connected devices.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Query</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'webcam'" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hostname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hostname</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., .google.com" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="org"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Google LLC'" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 22, 3389" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., US, IN" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Mountain View'" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Generate Dork
            </Button>
            {generatedDork && (
              <div className="w-full space-y-2">
                <Label>Generated Dork</Label>
                <div className="flex w-full items-center gap-2">
                  <Input readOnly value={generatedDork} className="bg-primary/20" />
                  <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
