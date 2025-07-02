'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { extractIoCs, type IocExtractorOutput } from '@/ai/flows/ioc-extractor-flow';
import { Loader2, AlertTriangle, ListCollapse, Sparkles, Network, Globe, Hash, FileCode, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  rawText: z.string().min(20, { message: 'Please provide at least 20 characters of text to analyze.' }),
});

const defaultText = `AlertID: 55219
Timestamp: 2024-05-21 11:34:01 UTC
Source: IDS-04
Description: Possible C2 Communication
Details: Suspicious outbound connection from 192.168.1.152 to evil-c2.network on port 443. Associated file is C:\\Users\\j.doe\\AppData\\Local\\Temp\\updater.exe (SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855). Other observed domains include my-bad-domain.com.
---
Analyst Notes:
Found a log file on the compromised host. Seems like a dropper.
File path: /var/tmp/payload.sh
MD5 hash of payload: 1a59b9f022e6b2b4f2c0733564560d20
Also saw traffic to 203.0.113.55.
`;

const IocCard = ({ title, icon: Icon, iocs, copyValue }: { title: string, icon: React.ElementType, iocs: string[], copyValue: string }) => {
    const { toast } = useToast();

    if (iocs.length === 0) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(copyValue);
        toast({ title: "Copied!", description: `${title} have been copied to clipboard.` });
    };

    return (
        <Card className="bg-primary/20">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2"><Icon className="h-4 w-4" />{title}</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {iocs.map((ioc, index) => (
                        <Badge key={index} variant="secondary" className="font-mono">{ioc}</Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}


export function IocExtractor() {
  const [result, setResult] = useState<IocExtractorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rawText: defaultText,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await extractIoCs(values);
      setResult(response);
    } catch (err) {
      setError('Failed to extract IoCs. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <ListCollapse className="h-6 w-6" />
            <CardTitle>AI IoC Extractor</CardTitle>
        </div>
        <CardDescription>Paste unstructured text like logs or reports to automatically identify and extract indicators.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="rawText"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Raw Text Data</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Paste logs, reports, or analyst notes here..." {...field} className="font-mono min-h-[300px]" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Extract IoCs
                    </Button>
                </form>
            </Form>

             <div className="space-y-4">
                <FormLabel>Extracted Indicators</FormLabel>
                <div className="h-full min-h-[300px] border rounded-md p-4 bg-primary/20 space-y-4 overflow-y-auto">
                    {isLoading && <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                    {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
                    {!isLoading && !result && <div className="text-muted-foreground text-center h-full flex flex-col items-center justify-center">Extracted IoCs will appear here.</div>}
                    
                    {result && (
                        <div className="space-y-4 animate-in fade-in">
                            <IocCard title="IP Addresses" icon={Network} iocs={result.ips} copyValue={result.ips.join('\\n')} />
                            <IocCard title="Domains" icon={Globe} iocs={result.domains} copyValue={result.domains.join('\\n')} />
                            <IocCard title="File Hashes" icon={Hash} iocs={result.hashes.map(h => h.value)} copyValue={result.hashes.map(h => h.value).join('\\n')} />
                            <IocCard title="File Paths / Names" icon={FileCode} iocs={result.files} copyValue={result.files.join('\\n')} />
                            
                            {result.ips.length === 0 && result.domains.length === 0 && result.hashes.length === 0 && result.files.length === 0 && (
                                <p className="text-muted-foreground text-center pt-8">No IoCs were identified in the provided text.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
