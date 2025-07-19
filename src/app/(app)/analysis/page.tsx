
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, FileScan, Hash, Terminal, List } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VirusTotalScanner } from '@/components/virustotal-scanner';
import { SteganographyAnalyzer } from '@/components/steganography-analyzer';
import { YaraRuleGenerator } from '@/components/yara-rule-generator';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import MD5 from 'crypto-js/md5';
import SHA1 from 'crypto-js/sha1';
import SHA256 from 'crypto-js/sha256';
import { IocExtractor } from '@/components/ioc-extractor';

const formSchema = z.object({
  file: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'Please select a file.')
});

type ClientSideAnalysisResult = {
    fileName: string;
    fileSize: number;
    fileType: string;
    hashes: {
        md5: string;
        sha1: string;
        sha256: string;
    };
    strings: string[];
}

const extractStrings = (buffer: ArrayBuffer, minLength = 4) => {
    const view = new Uint8Array(buffer);
    const result: string[] = [];
    let currentString = '';
    for (let i = 0; i < view.length; i++) {
        const charCode = view[i];
        if (charCode >= 32 && charCode <= 126) {
            currentString += String.fromCharCode(charCode);
        } else {
            if (currentString.length >= minLength) {
                result.push(currentString);
            }
            currentString = '';
        }
    }
    if (currentString.length >= minLength) {
        result.push(currentString);
    }
    return result;
};


export default function AnalysisPage() {
  const [result, setResult] = useState<ClientSideAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);

    const file = values.file[0];

    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            if (buffer) {
                const wordArray = new Uint8Array(buffer);
                const md5 = MD5(wordArray as any).toString();
                const sha1 = SHA1(wordArray as any).toString();
                const sha256 = SHA256(wordArray as any).toString();
                const strings = extractStrings(buffer);
                
                setResult({
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type || 'unknown',
                    hashes: { md5, sha1, sha256 },
                    strings,
                });

                logActivity({
                    user: user?.displayName || 'Analyst',
                    action: 'Analyzed File (Client-Side)',
                    details: `File: ${file.name}`
                });
            }
        };
        reader.onerror = () => {
             setError('Failed to read file for analysis.');
        }
        reader.readAsArrayBuffer(file);

    } catch (err) {
      setError('An error occurred during file processing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Malware Analysis Toolkit</h1>
        <p className="text-muted-foreground">A collection of tools for analyzing suspicious files and artifacts.</p>
      </div>
      
      <IocExtractor />
      <VirusTotalScanner />
      <YaraRuleGenerator />
      <SteganographyAnalyzer />

      <Card>
        <CardHeader>
          <CardTitle>Client-Side File Analyzer</CardTitle>
          <CardDescription>Analyze a file locally in your browser. The file is not uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <FormItem>
                    <FormLabel>File for Analysis</FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
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
              <Button type="submit" disabled={isLoading}>
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
                  Analysis Report for <span className="font-mono">{result.fileName}</span>
                </CardTitle>
                 <CardDescription>File Size: {result.fileSize} bytes, Type: {result.fileType}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Hash className="h-5 w-5"/>Hashes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm font-mono">
                       <div className="font-mono break-all p-2 rounded bg-primary/20"><dt className="font-semibold text-foreground">MD5</dt><dd className="text-muted-foreground">{result.hashes.md5}</dd></div>
                       <div className="font-mono break-all p-2 rounded bg-primary/20"><dt className="font-semibold text-foreground">SHA1</dt><dd className="text-muted-foreground">{result.hashes.sha1}</dd></div>
                       <div className="font-mono break-all p-2 rounded bg-primary/20"><dt className="font-semibold text-foreground">SHA256</dt><dd className="text-muted-foreground">{result.hashes.sha256}</dd></div>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Terminal className="h-5 w-5"/>Printable Strings</h3>
                    <pre className="bg-primary/20 p-4 rounded-md text-sm text-foreground overflow-y-auto max-h-80 font-mono">
                        <code>{result.strings.join('\n')}</code>
                    </pre>
                </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
