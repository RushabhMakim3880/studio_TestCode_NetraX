'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scanForInjections, type InjectionScanOutput } from '@/ai/flows/injection-scanner-flow';
import { Loader2, AlertTriangle, Syringe, ShieldAlert, ShieldQuestion, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
});

const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
        case 'High': return <ShieldAlert className="h-4 w-4 text-red-500" />;
        case 'Medium': return <ShieldQuestion className="h-4 w-4 text-amber-500" />;
        case 'Low': return <ShieldCheck className="h-4 w-4 text-sky-500" />;
        default: return <ShieldQuestion className="h-4 w-4" />;
    }
};

const getConfidenceVariant = (confidence: string): "destructive" | "secondary" | "outline" | "default" => {
    switch (confidence) {
        case 'High': return 'destructive';
        case 'Medium': return 'secondary';
        default: 'outline';
    }
    return 'outline'
};


export function InjectionScanner() {
  const [result, setResult] = useState<InjectionScanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: 'http://testphp.vulnweb.com/listproducts.php?cat=1',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await scanForInjections(values);
      setResult(response);
    } catch (err) {
      setError('Failed to run injection scan. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Syringe className="h-6 w-6" />
            <CardTitle>Injection Vulnerability Scanner</CardTitle>
        </div>
        <CardDescription>Simulate scanning a URL for potential injection vulnerabilities like SQLi and XSS.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com?id=1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scan for Vulnerabilities
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {result && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Scan Results ({result.vulnerabilities.length} potential findings)</h3>
                    {result.vulnerabilities.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                            {result.vulnerabilities.map((vuln, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3 flex-1 text-left">
                                        <Badge variant={getConfidenceVariant(vuln.confidence)}>{getConfidenceIcon(vuln.confidence)} {vuln.confidence}</Badge>
                                        <span className="font-semibold">{vuln.type}</span>
                                        <span className="text-muted-foreground truncate">on parameter <span className="font-mono text-accent">{vuln.parameter}</span></span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pl-2">
                                    <div>
                                        <p className="font-semibold">Description</p>
                                        <p className="text-muted-foreground">{vuln.description}</p>
                                    </div>
                                </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
                           <ShieldCheck className="h-10 w-10 text-green-400" />
                           <p>No potential injection vulnerabilities were found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
