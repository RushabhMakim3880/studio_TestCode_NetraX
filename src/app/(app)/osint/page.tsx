'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { gatherOsint, type OsintOutput } from '@/ai/flows/osint-flow';
import { Loader2, AlertTriangle, Fingerprint, Mail, Link as LinkIcon, Server } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SocialMediaAnalyzer } from '@/components/social-media-analyzer';

const formSchema = z.object({
  domain: z.string().min(3, { message: 'Domain must be at least 3 characters.' }).includes('.', { message: 'Please enter a valid domain.' }),
});

export default function OsintPage() {
  const [result, setResult] = useState<OsintOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: 'global-corp.com',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await gatherOsint(values);
      setResult(response);
    } catch (err) {
      setError('Failed to gather OSINT data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">OSINT Investigator</h1>
        <p className="text-muted-foreground">Gather open-source intelligence on targets.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domain Intelligence</CardTitle>
          <CardDescription>Enter a domain to generate a simulated OSINT report.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full">
                    <FormLabel>Target Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gather Intelligence
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Fingerprint className="h-6 w-6" />
              <CardTitle>OSINT Report: {form.getValues('domain')}</CardTitle>
            </div>
            <CardDescription>{result.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2"><Mail className="h-4 w-4" /> Discovered Emails</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {result.discoveredEmails.map((email, i) => <li key={i}>{email}</li>)}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2"><Server className="h-4 w-4" /> Discovered Subdomains</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {result.subdomains.map((sub, i) => <li key={i}>{sub}</li>)}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Social Media Profiles</h3>
                 <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {result.socialMediaProfiles.map((link, i) => <li key={i}>{link}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <SocialMediaAnalyzer />
    </div>
  );
}
