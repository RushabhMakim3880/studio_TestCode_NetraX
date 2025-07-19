
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { analyzeHeaders, type HeaderAnalyzerOutput } from '@/ai/flows/header-analyzer-flow';
import { Loader2, AlertTriangle, ShieldCheck, ShieldHalf, ShieldX, ShieldAlert, ShieldQuestion, Info, Code, Clipboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';

const formSchema = z.object({
  headers: z.string().min(20, { message: 'Please paste at least one security header.' }),
});

const defaultHeaders = `Content-Security-Policy: script-src 'self' 'unsafe-inline' https://apis.google.com; object-src 'none';
X-Frame-Options: DENY`;

const getSeverityIcon = (severity: string) => {
    switch (severity) {
        case 'Critical': return <ShieldX className="h-4 w-4 text-destructive" />;
        case 'High': return <ShieldAlert className="h-4 w-4 text-red-500" />;
        case 'Medium': return <ShieldQuestion className="h-4 w-4 text-amber-500" />;
        case 'Low': return <Info className="h-4 w-4 text-sky-500" />;
        case 'Informational': return <Info className="h-4 w-4 text-muted-foreground" />;
        default: return <ShieldQuestion className="h-4 w-4" />;
    }
};

const getSeverityVariant = (severity: string): "destructive" | "secondary" | "outline" | "default" => {
    switch (severity) {
        case 'Critical': return 'destructive';
        case 'High': return 'destructive';
        case 'Medium': return 'secondary';
        default: return 'outline';
    }
};

export function HeaderAnalyzer() {
  const [result, setResult] = useState<HeaderAnalyzerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headers: defaultHeaders,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await analyzeHeaders(values);
      setResult(response);
    } catch (err) {
      setError('Failed to analyze headers. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

   const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Payload copied to clipboard.' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <ShieldHalf className="h-6 w-6" />
            <CardTitle>CSP & Security Headers Analyzer</CardTitle>
        </div>
        <CardDescription>Paste security headers to automatically check for misconfigurations and get bypass payloads.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="headers"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Security Headers</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Paste headers here..." {...field} className="font-mono h-24" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Headers
            </Button>
          </form>
        </Form>

        <div className="mt-6 grid md:grid-cols-2 gap-8">
            <div>
                <Label>Findings</Label>
                <div className="mt-2 border rounded-md p-2 min-h-[300px]">
                    {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                    {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
                    
                    {result && (
                        <div>
                            {result.findings.length > 0 ? (
                                <Accordion type="multiple" className="w-full" defaultValue={result.findings.map((_, i) => `item-${i}`)}>
                                    {result.findings.map((finding, index) => (
                                        <AccordionItem value={`item-${index}`} key={index}>
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-3 flex-1 text-left">
                                                {getSeverityIcon(finding.severity)}
                                                <Badge variant={getSeverityVariant(finding.severity)}>{finding.severity}</Badge>
                                                <span className="flex-1 font-mono text-xs">{finding.header}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-3 pl-2">
                                            <div>
                                                <p className="font-semibold">Description</p>
                                                <p className="text-muted-foreground">{finding.description}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold">Recommendation</p>
                                                <p className="text-muted-foreground">{finding.recommendation}</p>
                                            </div>
                                        </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
                                <ShieldCheck className="h-10 w-10 text-green-400" />
                                <p>No major security weaknesses identified.</p>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
            </div>
             <div>
                <Label>Generated Payloads</Label>
                <div className="mt-2 border rounded-md p-2 min-h-[300px]">
                    {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                     {result && result.exploitPayloads && result.exploitPayloads.length > 0 ? (
                        <div className="space-y-4">
                            {result.exploitPayloads.map((exploit, index) => (
                                <div key={index} className="space-y-2">
                                    <h4 className="font-semibold">{exploit.type}</h4>
                                    <p className="text-xs text-muted-foreground">{exploit.explanation}</p>
                                    <div className="relative">
                                        <pre className="bg-primary/20 p-3 rounded-md text-sm overflow-x-auto font-mono pr-10">
                                            <code>{exploit.payload}</code>
                                        </pre>
                                         <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => handleCopy(exploit.payload)}>
                                            <Clipboard className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                        !isLoading && <div className="text-center text-muted-foreground h-full flex items-center justify-center">No exploit payloads generated.</div>
                     )}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
