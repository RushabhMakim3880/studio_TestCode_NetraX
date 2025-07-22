
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Eye, Globe } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { dnsLookup } from '@/actions/osint-actions';
import { generateLookalikeDomains, LookalikeDomain } from '@/ai/flows/domain-monitor-flow';

const formSchema = z.object({
  domain: z.string().refine(val => !val.startsWith('www.'), { message: "Enter the domain without 'www.'"}).refine(val => val.includes('.'), { message: 'Please enter a valid domain.' }),
});

type DomainStatus = LookalikeDomain & {
    isRegistered: boolean;
};

export function DomainMonitor() {
  const [results, setResults] = useState<DomainStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { domain: 'google.com' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults([]);
    setError(null);
    try {
        const lookalikeRes = await generateLookalikeDomains({ domain: values.domain });
        
        const checkedDomains: DomainStatus[] = await Promise.all(
            lookalikeRes.domains.map(async (domain) => {
                try {
                    const dnsRes = await dnsLookup(domain.domainName, 'A');
                    return { ...domain, isRegistered: dnsRes.length > 0 };
                } catch (e) {
                    return { ...domain, isRegistered: false }; // Assume not registered if DNS lookup fails
                }
            })
        );
        
        setResults(checkedDomains);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Eye className="h-6 w-6" />
            <CardTitle>Phishing Domain Monitor</CardTitle>
        </div>
        <CardDescription>Detect potential typosquatting and lookalike domains that could be used for phishing.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField control={form.control} name="domain" render={({ field }) => ( <FormItem className="flex-grow w-full"> <FormLabel>Your Company Domain</FormLabel> <FormControl><Input placeholder="yourcompany.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Monitor Domains
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {results.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Monitoring Results</h3>
                    <div className="border rounded-md max-h-96 overflow-y-auto">
                        <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Lookalike Domain</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((res) => (
                                <TableRow key={res.domainName}>
                                    <TableCell className="font-mono">{res.domainName}</TableCell>
                                    <TableCell><Badge variant="secondary">{res.technique}</Badge></TableCell>
                                    <TableCell>
                                        {res.isRegistered ? <Badge variant="destructive">Registered</Badge> : <Badge variant="outline">Available</Badge>}
                                    </TableCell>
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
