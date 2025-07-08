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
import { analyzeFirmware, type FirmwareAnalysisOutput } from '@/ai/flows/firmware-analysis-flow';
import { Loader2, AlertTriangle, Cpu, ShieldX, ShieldAlert, ShieldQuestion, Info, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FirmwareAnalysisInputSchema = z.object({
  fileName: z.string().min(1, 'Please select a file.'),
  deviceDescription: z.string().describe("A brief description of the IoT device."),
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

export function FirmwareAnalyzer() {
  const [result, setResult] = useState<FirmwareAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FirmwareAnalysisInputSchema>>({
    resolver: zodResolver(FirmwareAnalysisInputSchema),
    defaultValues: {
      fileName: '',
      deviceDescription: "A cheap, off-the-shelf smart home camera with cloud connectivity.",
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('fileName', file.name);
    }
  };

  async function onSubmit(values: z.infer<typeof FirmwareAnalysisInputSchema>) {
    if (!values.fileName) {
        form.setError('fileName', { message: 'Please select a firmware file.' });
        return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await analyzeFirmware(values);
      setResult(response);
    } catch (err) {
      setError('Failed to analyze firmware. The simulation may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Cpu className="h-6 w-6" />
          <CardTitle>IoT Firmware Analyzer</CardTitle>
        </div>
        <CardDescription>Simulate analyzing an IoT firmware file for vulnerabilities. The file is not uploaded.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmware File</FormLabel>
                    <FormControl>
                        <Input 
                            type="file"
                            accept=".bin,.img,.zip"
                            onChange={handleFileChange}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="deviceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Description</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Describe the device (e.g., 'Smart lightbulb controller')..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Firmware
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
          
          {result && (
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Analysis Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>
                
                <div>
                    <h3 className="font-semibold text-lg mb-2">Security Findings ({result.findings.length})</h3>
                    {result.findings.length > 0 ? (
                        <Accordion type="multiple" className="w-full" defaultValue={result.findings.map((_, i) => `item-${i}`)}>
                            {result.findings.map((finding, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3 flex-1 text-left">
                                        {getSeverityIcon(finding.severity)}
                                        <Badge variant={getSeverityVariant(finding.severity)}>{finding.severity}</Badge>
                                        <span className="flex-1 truncate">{finding.type}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pl-2">
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
                            <CheckCircle className="h-10 w-10 text-green-400" />
                            <p>No major security weaknesses identified in the simulated analysis.</p>
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
