'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { analyzeFile, type MalwareAnalysisOutput } from '@/ai/flows/malware-analysis-flow';
import { Loader2, AlertTriangle, FileScan, CheckCircle, ShieldAlert, ShieldX, Hash, Terminal, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formSchema = z.object({
  file: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'Please select a file.')
});

const getVerdictIcon = (verdict?: string) => {
  switch (verdict?.toLowerCase()) {
    case 'malicious':
      return <ShieldX className="h-10 w-10 text-destructive" />;
    case 'suspicious':
      return <ShieldAlert className="h-10 w-10 text-amber-400" />;
    case 'safe':
      return <CheckCircle className="h-10 w-10 text-green-400" />;
    default:
      return <FileScan className="h-10 w-10 text-muted-foreground" />;
  }
};

const getVerdictColor = (verdict?: string): 'destructive' | 'secondary' | 'default' => {
  switch (verdict?.toLowerCase()) {
    case 'malicious':
      return 'destructive';
    case 'suspicious':
      return 'secondary';
    case 'safe':
      return 'default';
    default:
      return 'default';
  }
}

export default function AnalysisPage() {
  const [result, setResult] = useState<MalwareAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);

    const file = values.file[0];
    setFileName(file.name);

    try {
      const response = await analyzeFile({
        filename: file.name,
        fileSize: file.size,
      });
      setResult(response);
    } catch (err) {
      setError('Failed to analyze file. The simulation may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Static Malware Analysis</h1>
        <p className="text-muted-foreground">Perform static analysis on suspicious files (simulation).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Submission</CardTitle>
          <CardDescription>Select a file to begin the simulated analysis. The file is not uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                        <Input 
                            {...fieldProps}
                            ref={fileInputRef}
                            type="file" 
                            onChange={(e) => onChange(e.target.files)}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze File
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <FileScan className="h-6 w-6" />
                  Analysis Report for <span className="font-mono">{fileName}</span>
                </CardTitle>
                <CardDescription>Generated static analysis results.</CardDescription>
              </div>
              <div className="text-center">
                  {getVerdictIcon(result.verdict)}
                  <Badge variant={getVerdictColor(result.verdict)} className="mt-2 px-3 py-1 text-sm">{result.verdict}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.threatName && <p className="text-destructive font-semibold">Threat Detected: <span className="font-mono">{result.threatName}</span></p>}
            <p className="text-sm text-muted-foreground">{result.analysisSummary}</p>

            <Accordion type="multiple" defaultValue={['hashes', 'strings']} className="w-full">
              <AccordionItem value="hashes">
                <AccordionTrigger><div className="flex items-center gap-2"><Hash className="h-4 w-4"/> Hashes & File Info</div></AccordionTrigger>
                <AccordionContent>
                  <dl className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div className="font-mono break-all"><dt className="font-semibold text-foreground">MD5</dt><dd className="text-muted-foreground">{result.fileInfo.md5}</dd></div>
                    <div className="font-mono break-all"><dt className="font-semibold text-foreground">SHA1</dt><dd className="text-muted-foreground">{result.fileInfo.sha1}</dd></div>
                    <div className="font-mono break-all"><dt className="font-semibold text-foreground">SHA256</dt><dd className="text-muted-foreground">{result.fileInfo.sha256}</dd></div>
                    <div className="col-span-full"><dt className="font-semibold text-foreground">File Type</dt><dd className="text-muted-foreground">{result.fileInfo.fileType}</dd></div>
                  </dl>
                </AccordionContent>
              </AccordionItem>
              
              {result.peInfo && (
                <AccordionItem value="pe-info">
                    <AccordionTrigger><div className="flex items-center gap-2"><List className="h-4 w-4"/> PE Sections & Info</div></AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                           <p className="text-sm"><strong>Entry Point: </strong><span className="font-mono text-muted-foreground">{result.peInfo.entryPoint}</span></p>
                           <p className="text-sm"><strong>Image Base: </strong><span className="font-mono text-muted-foreground">{result.peInfo.imageBase}</span></p>
                        </div>
                        <Table>
                            <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Address</TableHead><TableHead>Size</TableHead><TableHead className="text-right">Entropy</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {result.peInfo.sections.map(section => (
                                    <TableRow key={section.name}>
                                        <TableCell className="font-mono">{section.name}</TableCell>
                                        <TableCell className="font-mono">{section.virtualAddress}</TableCell>
                                        <TableCell className="font-mono">{section.virtualSize}</TableCell>
                                        <TableCell className="text-right font-mono">{section.entropy.toFixed(4)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="strings">
                <AccordionTrigger><div className="flex items-center gap-2"><Terminal className="h-4 w-4"/> Detected Strings</div></AccordionTrigger>
                <AccordionContent>
                  <pre className="bg-primary/20 p-4 rounded-md text-sm text-foreground overflow-y-auto max-h-60 font-mono">
                    <code>{result.detectedStrings.join('\n')}</code>
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
