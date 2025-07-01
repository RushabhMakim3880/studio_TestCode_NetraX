'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzeConfiguration, type ConfigAnalyzerOutput } from '@/ai/flows/config-analyzer-flow';
import { Loader2, AlertTriangle, ShieldCheck, FileCog, ShieldX, ShieldAlert, ShieldQuestion, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  configType: z.string().min(1, { message: 'Please select a configuration type.' }),
  configContent: z.string().min(20, { message: 'Configuration content must be at least 20 characters.' }),
});

const configTypes = ['Nginx', 'Apache', 'sshd_config', 'Dockerfile', 'Generic'];
const defaultNginxConfig = `server {
    listen 80;
    server_name example.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Insecure - listing directory contents
    location /files {
        autoindex on;
    }
}`;

const getSeverityIcon = (severity: string) => {
    switch (severity) {
        case 'Critical': return <ShieldX className="h-4 w-4 text-destructive" />;
        case 'High': return <ShieldAlert className="h-4 w-4 text-red-500" />;
        case 'Medium': return <ShieldQuestion className="h-4 w-4 text-amber-500" />;
        case 'Low': return <ShieldCheck className="h-4 w-4 text-sky-500" />;
        case 'Informational': return <Info className="h-4 w-4 text-muted-foreground" />;
        default: return <ShieldCheck className="h-4 w-4" />;
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

export function ConfigAnalyzer() {
  const [result, setResult] = useState<ConfigAnalyzerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      configType: 'Nginx',
      configContent: defaultNginxConfig,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await analyzeConfiguration(values);
      setResult(response);
    } catch (err) {
      setError('Failed to analyze configuration. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <FileCog className="h-6 w-6" />
            <CardTitle>Configuration Analyzer</CardTitle>
        </div>
        <CardDescription>Paste a configuration file to automatically check for security misconfigurations.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <FormField
                    control={form.control}
                    name="configType"
                    render={({ field }) => (
                        <FormItem className="md:col-span-1">
                        <FormLabel>Config Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {configTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="configContent"
                    render={({ field }) => (
                        <FormItem className="md:col-span-3">
                        <FormLabel>Configuration Content</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Paste your config file content here..." {...field} className="font-mono min-h-[200px]" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Configuration
            </Button>
          </form>
        </Form>

        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {result && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Analysis Results ({result.findings.length} findings)</h3>
                    {result.findings.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                            {result.findings.map((finding, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3 flex-1 text-left">
                                        {getSeverityIcon(finding.severity)}
                                        <Badge variant={getSeverityVariant(finding.severity)}>{finding.severity}</Badge>
                                        <span className="flex-1">{finding.description.split('.')[0]}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3">
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
                           <p>No security issues found based on the analysis.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
