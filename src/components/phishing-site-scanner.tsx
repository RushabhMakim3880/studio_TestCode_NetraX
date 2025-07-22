
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Shield, Search, Globe, Fingerprint, BookKey } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { DnsRecord, dnsLookup, whoisLookup } from '@/actions/osint-actions';
import { analyzePhishingPage, PhishingPageAnalysis } from '@/ai/flows/phishing-page-analyzer-flow';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
});

type CombinedScanResult = {
    analysis: PhishingPageAnalysis;
    whois: string;
    dns: DnsRecord[];
};

export function PhishingSiteScanner() {
  const [result, setResult] = useState<CombinedScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
        const url = new URL(values.url);
        const domain = url.hostname;

        // Run all scans in parallel
        const [analysisRes, whoisRes, dnsRes] = await Promise.all([
            analyzePhishingPage({ url: values.url }),
            whoisLookup(domain),
            dnsLookup(domain, 'A')
        ]);
        
        setResult({
            analysis: analysisRes,
            whois: whoisRes,
            dns: dnsRes,
        });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during the scan.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const getRiskVariant = (risk: string): 'destructive' | 'secondary' | 'default' => {
    switch (risk.toLowerCase()) {
        case 'high': return 'destructive';
        case 'medium': return 'secondary';
        default: return 'default';
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <CardTitle>Phishing Site Scanner</CardTitle>
        </div>
        <CardDescription>Analyze a URL to detect phishing characteristics, check domain age, and review DNS records.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField control={form.control} name="url" render={({ field }) => ( <FormItem className="flex-grow w-full"> <FormLabel>Suspicious URL</FormLabel> <FormControl><Input placeholder="https://example-login.com/secure" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Search className="mr-2 h-4 w-4" />
              Scan URL
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {result && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Overall Assessment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <div className="flex items-center gap-2">
                                <p>Risk Level:</p>
                                <Badge variant={getRiskVariant(result.analysis.riskLevel)}>{result.analysis.riskLevel}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{result.analysis.summary}</p>
                        </CardContent>
                    </Card>

                    <Accordion type="multiple" defaultValue={['details', 'whois']}>
                        <AccordionItem value="details">
                            <AccordionTrigger><div className="flex items-center gap-2"><Globe className="h-4 w-4"/> AI Analysis Details</div></AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <ul className="list-disc list-inside space-y-2">
                                    {result.analysis.flags.map((flag, i) => (
                                        <li key={i}>{flag}</li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="whois">
                            <AccordionTrigger><div className="flex items-center gap-2"><Fingerprint className="h-4 w-4"/> Whois Record</div></AccordionTrigger>
                            <AccordionContent className="pt-2">
                               <pre className="bg-primary/20 p-4 rounded-md text-sm text-foreground overflow-x-auto font-mono max-h-60">
                                  <code>{result.whois}</code>
                               </pre>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="dns">
                            <AccordionTrigger><div className="flex items-center gap-2"><BookKey className="h-4 w-4"/> DNS A Records</div></AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <ul className="list-disc list-inside space-y-1 font-mono text-sm">
                                   {result.dns.length > 0 ? result.dns.map((r, i) => (
                                       <li key={i}>{r.value}</li>
                                   )) : <li>No A records found.</li>}
                                </ul>
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
