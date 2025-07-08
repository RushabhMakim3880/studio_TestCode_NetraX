'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { monitorBrandAbuse, type BrandAbuseOutput } from '@/ai/flows/brand-abuse-flow';
import { Loader2, AlertTriangle, ShieldCheck, Fish, Copyright, AtSign, Globe } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const BrandAbuseInputSchema = z.object({
  brandName: z.string().describe('The brand name to monitor (e.g., "Global-Corp").'),
  domain: z.string().describe('The primary domain of the brand (e.g., "global-corp.com").'),
});

export function BrandAbuseMonitor() {
  const [result, setResult] = useState<BrandAbuseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof BrandAbuseInputSchema>>({
    resolver: zodResolver(BrandAbuseInputSchema),
    defaultValues: {
      brandName: 'Global-Corp',
      domain: 'global-corp.com',
    },
  });

  async function onSubmit(values: z.infer<typeof BrandAbuseInputSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await monitorBrandAbuse(values);
      setResult(response);
    } catch (err) {
      setError('Failed to fetch brand abuse data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6" />
            <CardTitle>Brand Abuse Monitor</CardTitle>
        </div>
        <CardDescription>Simulate scanning the web for brand impersonation, typosquatting, and copyright infringement.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="brandName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Brand Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Primary Domain</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., acme.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Monitor Brand
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {result && (
                <div className="space-y-4">
                     <Accordion type="multiple" className="w-full" defaultValue={['phishing', 'typo', 'social', 'copyright']}>
                        <AccordionItem value="phishing">
                            <AccordionTrigger><div className="flex items-center gap-2"><Fish className="h-4 w-4 text-red-500" /> Suspected Phishing URLs ({result.suspectedPhishingUrls.length})</div></AccordionTrigger>
                            <AccordionContent><div className="flex flex-col gap-1 pl-2">{result.suspectedPhishingUrls.map(url => <p key={url} className="text-sm font-mono text-muted-foreground">{url}</p>)}</div></AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="typo">
                            <AccordionTrigger><div className="flex items-center gap-2"><Globe className="h-4 w-4 text-amber-500" /> Typosquatted Domains ({result.typosquattedDomains.length})</div></AccordionTrigger>
                            <AccordionContent><div className="flex flex-col gap-1 pl-2">{result.typosquattedDomains.map(d => <p key={d} className="text-sm font-mono text-muted-foreground">{d}</p>)}</div></AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="social">
                            <AccordionTrigger><div className="flex items-center gap-2"><AtSign className="h-4 w-4 text-sky-500" /> Social Media Mentions ({result.socialMediaMentions.length})</div></AccordionTrigger>
                            <AccordionContent>
                                {result.socialMediaMentions.map((mention, i) => (
                                    <blockquote key={i} className="mt-2 border-l-2 pl-4 italic">
                                        <p className="text-sm">"{mention.snippet}"</p>
                                        <footer className="text-xs text-muted-foreground">- {mention.author} on {mention.platform}</footer>
                                    </blockquote>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="copyright" className="border-b-0">
                            <AccordionTrigger><div className="flex items-center gap-2"><Copyright className="h-4 w-4 text-gray-400" /> Copyright Infringements ({result.copyrightInfringements.length})</div></AccordionTrigger>
                            <AccordionContent>
                                {result.copyrightInfringements.map((item, i) => (
                                    <div key={i} className="mt-2 text-sm">
                                        <p className="font-semibold">{item.site}</p>
                                        <p className="text-muted-foreground">{item.description}</p>
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
