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
import { analyzeLogs, type LogAnalysisOutput } from '@/ai/flows/log-analysis-flow';
import { Loader2, AlertTriangle, GanttChartSquare, ShieldX, ShieldAlert, ShieldQuestion, Info, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  logType: z.string().min(1, { message: 'Please select a log type.' }),
  logContent: z.string().min(50, { message: 'Log content must be at least 50 characters.' }),
});

const logTypes = ['Apache Access Log', 'Syslog', 'Windows Event Log (Security)', 'Generic Application Log'];
const defaultLogContent = `127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
192.168.1.10 - frank [10/Oct/2000:13:55:36 -0700] "GET /login.php?user=admin&pass=admin' OR 1=1-- HTTP/1.0" 200 4500
192.168.1.11 - - [10/Oct/2000:14:01:12 -0700] "GET /scripts/..%c0%af../winnt/system32/cmd.exe?/c+dir HTTP/1.0" 404 325
192.168.1.10 - frank [10/Oct/2000:14:02:30 -0700] "POST /admin/upload.php HTTP/1.0" 200 150
192.168.1.12 - - [10/Oct/2000:14:03:01 -0700] "GET /etc/passwd HTTP/1.0" 404 200
`;

const getSeverityIcon = (severity?: string) => {
    if (!severity) return <Info className="h-4 w-4 text-muted-foreground" />;
    switch (severity.toLowerCase()) {
        case 'critical': return <ShieldX className="h-4 w-4 text-destructive" />;
        case 'high': return <ShieldAlert className="h-4 w-4 text-red-500" />;
        case 'medium': return <ShieldQuestion className="h-4 w-4 text-amber-500" />;
        case 'low': return <Info className="h-4 w-4 text-sky-500" />;
        case 'informational': return <Info className="h-4 w-4 text-muted-foreground" />;
        default: return <ShieldQuestion className="h-4 w-4" />;
    }
};

const getSeverityVariant = (severity?: string): "destructive" | "secondary" | "outline" | "default" => {
    if (!severity) return 'outline';
    switch (severity.toLowerCase()) {
        case 'critical': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'secondary';
        default: return 'outline';
    }
};

export default function LogAnalysisPage() {
  const [result, setResult] = useState<LogAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logType: 'Apache Access Log',
      logContent: defaultLogContent,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await analyzeLogs(values);
      setResult(response);
    } catch (err) {
      setError('Failed to analyze logs. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Log Analysis</h1>
        <p className="text-muted-foreground">Use AI to analyze log files for suspicious activity.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Log Analyzer</CardTitle>
          <CardDescription>Paste log data, select the type, and let the AI analyst find anomalies.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <FormField
                    control={form.control}
                    name="logType"
                    render={({ field }) => (
                        <FormItem className="md:col-span-1">
                        <FormLabel>Log Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {logTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="logContent"
                    render={({ field }) => (
                        <FormItem className="md:col-span-3">
                        <FormLabel>Log Content</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Paste your log file content here..." {...field} className="font-mono min-h-[200px]" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Logs
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {error && <Card className="border-destructive/50"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Error</CardTitle></div></CardHeader><CardContent><p>{error}</p></CardContent></Card>}
      
      {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GanttChartSquare className="h-6 w-6" />
              <CardTitle>Log Analysis Report</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Analysis Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
            </div>
            
            <div>
                <h3 className="font-semibold text-lg mb-2">Detected Anomalies ({result.anomalies.length} findings)</h3>
                 {result.anomalies.length > 0 ? (
                    <Accordion type="multiple" className="w-full" defaultValue={result.anomalies.map((_, i) => `item-${i}`)}>
                        {result.anomalies.map((anomaly, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-3 flex-1 text-left">
                                    {getSeverityIcon(anomaly.severity)}
                                    <Badge variant={getSeverityVariant(anomaly.severity)}>{anomaly.severity}</Badge>
                                    <span className="flex-1 truncate">{anomaly.description}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pl-2">
                                <div>
                                    <p className="font-semibold">Description</p>
                                    <p className="text-muted-foreground">{anomaly.description}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Recommendation</p>
                                    <p className="text-muted-foreground">{anomaly.recommendation}</p>
                                </div>
                                 <div>
                                    <p className="font-semibold">Evidence</p>
                                    <pre className="bg-primary/20 p-3 mt-1 rounded-md text-sm text-foreground overflow-x-auto font-mono">
                                        <code>{anomaly.relatedLogLine}</code>
                                    </pre>
                                </div>
                            </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
                       <CheckCircle className="h-10 w-10 text-green-400" />
                       <p>No security anomalies found in the provided logs.</p>
                    </div>
                )}
            </div>

          </CardContent>
        </Card>
      )}

    </div>
  );
}
