'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzePcap, type PcapAnalysisOutput } from '@/ai/flows/network-analysis-flow';
import { Loader2, AlertTriangle, Network, ShieldX, ShieldAlert, ShieldQuestion, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NetworkTopologyMapper } from '@/components/network-topology-mapper';

const formSchema = z.object({
  file: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'Please select a file.'),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
});

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

export default function NetworkAnalysisPage() {
  const [result, setResult] = useState<PcapAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
      description: "PCAP captured from a workstation showing slow performance and unusual DNS queries. Suspected malware infection.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);

    const file = values.file[0];

    try {
      const response = await analyzePcap({
        fileName: file.name,
        description: values.description,
      });
      setResult(response);
    } catch (err) {
      setError('Failed to analyze network capture. The simulation may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Network Traffic Analysis</h1>
        <p className="text-muted-foreground">Analyze network captures to identify threats and anomalies (simulation).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PCAP Analysis</CardTitle>
          <CardDescription>Select a mock PCAP file and provide context for the simulated analysis. The file is not uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <FormItem>
                    <FormLabel>PCAP File</FormLabel>
                    <FormControl>
                        <Input 
                            type="file"
                            accept=".pcap,.cap"
                            onChange={(e) => onChange(e.target.files)}
                            onBlur={onBlur}
                            name={name}
                            ref={ref}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analysis Context</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Describe the situation..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Traffic
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
              <Network className="h-6 w-6" />
              <CardTitle>Analysis Report: {form.getValues('file')?.[0]?.name}</CardTitle>
            </div>
            <CardDescription>Generated network forensic analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Executive Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.analysisSummary}</p>
            </div>
            
            <div>
                <h3 className="font-semibold text-lg mb-2">Detected Threats ({result.detectedThreats.length} findings)</h3>
                 {result.detectedThreats.length > 0 ? (
                    <Accordion type="multiple" className="w-full">
                        {result.detectedThreats.map((threat, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-3 flex-1 text-left">
                                    {getSeverityIcon(threat.severity)}
                                    <Badge variant={getSeverityVariant(threat.severity)}>{threat.severity}</Badge>
                                    <span className="flex-1">{threat.type}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3">
                                <p><strong className="font-semibold">Source IP:</strong> <span className="font-mono text-muted-foreground">{threat.sourceIp}</span></p>
                                <p><strong className="font-semibold">Destination IP:</strong> <span className="font-mono text-muted-foreground">{threat.destinationIp}</span></p>
                                <div>
                                    <p className="font-semibold">Description</p>
                                    <p className="text-muted-foreground">{threat.description}</p>
                                </div>
                            </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                       <p>No specific threats detected in this capture.</p>
                    </div>
                )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Notable Traffic Streams</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.notableStreams.map((stream, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{stream.timestamp}</TableCell>
                        <TableCell><Badge variant="outline">{stream.protocol}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{stream.source}</TableCell>
                        <TableCell className="font-mono text-xs">{stream.destination}</TableCell>
                        <TableCell className="text-sm">{stream.summary}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

          </CardContent>
        </Card>
      )}

      <NetworkTopologyMapper />
    </div>
  );
}
