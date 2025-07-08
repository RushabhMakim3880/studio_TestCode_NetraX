'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateDocument, type DocumentGeneratorOutput } from '@/ai/flows/document-generator-flow';
import { Loader2, AlertTriangle, Sparkles, FileText, Bot, Clipboard, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { CompanyProfile } from '@/components/company-profile-manager';
import type { FileSystemNode } from '@/components/file-browser';

const documentTypes = ['Statement of Work (SOW)', 'Letter of Reconnaissance (LOR)', 'Standard Operating Procedure (SOP)'] as const;

const formSchema = z.object({
  documentType: z.enum(documentTypes),
  projectName: z.string().min(1, 'Project name is required.'),
  projectTarget: z.string().min(1, 'Project target is required.'),
  projectObjective: z.string().min(10, 'Project objective must be at least 10 characters.'),
});


export function DocumentGenerator() {
  const [result, setResult] = useState<DocumentGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('netra-company-profile');
      if (storedProfile) {
        setCompanyProfile(JSON.parse(storedProfile));
      }
    } catch(e) { console.error(e); }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: 'Statement of Work (SOW)',
      projectName: 'Project Chimera',
      projectTarget: 'Global-Corp Inc. external infrastructure',
      projectObjective: 'Identify and report critical vulnerabilities in public-facing web applications.',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateDocument(values);
      setResult(response);
    } catch (err) {
      setError('Failed to generate document. The AI may have refused the request due to safety policies.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = () => {
    if (result?.documentContent) {
      navigator.clipboard.writeText(result.documentContent);
      toast({ title: "Copied!", description: "Document content copied to clipboard." });
    }
  };

  const handleSaveToFileManager = () => {
    if (!result) return;
    
    try {
        const storedFs = localStorage.getItem('netra-fs') || '[]';
        const fs: FileSystemNode[] = JSON.parse(storedFs);

        const reportsFolder = fs.find(node => node.name === 'Reports' && node.parentId === 'root');
        const parentId = reportsFolder ? reportsFolder.id : 'root';

        const safeFilename = result.documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';

        const newFile: FileSystemNode = {
            id: crypto.randomUUID(),
            name: safeFilename,
            type: 'file',
            parentId: parentId,
            content: `# ${result.documentTitle}\n\n${result.documentContent}`,
            mimeType: 'text/markdown',
        };

        const newFs = [...fs, newFile];
        localStorage.setItem('netra-fs', JSON.stringify(newFs));
        toast({ title: 'Document Saved', description: `${safeFilename} was saved to the Reports folder.`});
    } catch(e) {
        console.error("Failed to save to File Manager", e);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the document.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <CardTitle>AI Document Generator</CardTitle>
        </div>
        <CardDescription>
          Generate professional engagement documents like SOWs and LORs using AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="documentType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                        {documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField control={form.control} name="projectName" render={({ field }) => (<FormItem><FormLabel>Project Name</FormLabel><FormControl><Input placeholder="e.g., Project Viper" {...field} /></FormControl><FormMessage /></FormItem>)}/>
               <FormField control={form.control} name="projectTarget" render={({ field }) => (<FormItem><FormLabel>Project Target</FormLabel><FormControl><Input placeholder="e.g., Acme Corp" {...field} /></FormControl><FormMessage /></FormItem>)}/>
               <FormField control={form.control} name="projectObjective" render={({ field }) => (<FormItem><FormLabel>Project Objective</FormLabel><FormControl><Textarea placeholder="Describe the main goal..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Document
              </Button>
            </form>
          </Form>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label>Generated Document</Label>
                <div className="flex gap-2">
                    {result && <Button variant="outline" size="sm" onClick={handleCopy}><Clipboard className="mr-2 h-4 w-4"/> Copy Text</Button>}
                    {result && <Button variant="outline" size="sm" onClick={handleSaveToFileManager}><Save className="mr-2 h-4 w-4"/> Save to Files</Button>}
                </div>
            </div>
            <div className="h-[70vh] border rounded-md p-4 bg-primary/20 space-y-4 overflow-y-auto">
              {isLoading && <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}
              {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
              {!isLoading && !result && (
                <div className="text-muted-foreground text-center h-full flex flex-col items-center justify-center">
                  <Bot className="h-10 w-10 mb-2" />
                  Your generated document will appear here.
                </div>
              )}

              {result && (
                <div className="bg-card p-6 rounded shadow-lg text-card-foreground">
                    {companyProfile && (
                        <header className="flex justify-between items-start pb-4 border-b mb-4">
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                                <p className="font-bold text-lg text-foreground">{companyProfile.name}</p>
                                <p>{companyProfile.address}</p>
                                <p>{companyProfile.contact}</p>
                            </div>
                            {companyProfile.logoDataUrl && (
                                <Image src={companyProfile.logoDataUrl} alt="Company Logo" width={100} height={100} className="max-h-16 w-auto object-contain" />
                            )}
                        </header>
                    )}
                    <div className="space-y-4 animate-in fade-in prose prose-sm dark:prose-invert max-w-none">
                        <h2 className="text-accent !mb-4">{result.documentTitle}</h2>
                        <div className="whitespace-pre-wrap font-sans">{result.documentContent}</div>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
