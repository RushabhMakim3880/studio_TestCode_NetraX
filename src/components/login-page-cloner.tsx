
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Link as LinkIcon, Download } from 'lucide-react';
import { cloneLoginPage, type PageClonerOutput } from '@/ai/flows/page-cloner-flow';
import { useToast } from '@/hooks/use-toast';

const pageClonerSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  pageDescription: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
});

export function LoginPageCloner() {
  const { toast } = useToast();
  const [clonerResult, setClonerResult] = useState<PageClonerOutput | null>(null);
  const [isClonerLoading, setIsClonerLoading] = useState(false);
  const [clonerError, setClonerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof pageClonerSchema>>({
    resolver: zodResolver(pageClonerSchema),
    defaultValues: {
      targetUrl: 'https://login.microsoftonline.com/',
      pageDescription: 'A standard Microsoft 365 login page.',
    },
  });

  async function onClonerSubmit(values: z.infer<typeof pageClonerSchema>) {
    setIsClonerLoading(true);
    setClonerResult(null);
    setClonerError(null);
    try {
      const response = await cloneLoginPage(values);
      setClonerResult(response);
    } catch (err) {
      if (err instanceof Error && (err.message.includes('503') || err.message.toLowerCase().includes('overloaded'))) {
        setClonerError('The AI service is temporarily busy. Please try again.');
      } else {
        setClonerError('Failed to clone page. The request may have been blocked by safety filters.');
      }
      console.error(err);
    } finally {
      setIsClonerLoading(false);
    }
  }

  const handleDownloadHtml = () => {
    if (clonerResult?.htmlContent) {
      const blob = new Blob([clonerResult.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cloned_login.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: "Your cloned HTML file is downloading." });
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Page Cloner</CardTitle>
          <CardDescription>Generate a static HTML clone of a login page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onClonerSubmit)} className="space-y-4">
              <FormField control={form.control} name="targetUrl" render={({ field }) => ( <FormItem> <FormLabel>Target URL</FormLabel> <FormControl><Input placeholder="https://example.com/login" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="pageDescription" render={({ field }) => ( <FormItem> <FormLabel>Page Description</FormLabel> <FormControl><Textarea placeholder="A corporate SSO portal with a blue color scheme..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <Button type="submit" disabled={isClonerLoading} className="w-full">
                {isClonerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clone Page
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="lg:col-span-3">
        {clonerError && <Card className="border-destructive/50 mb-4"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Error</CardTitle></div></CardHeader><CardContent><p>{clonerError}</p></CardContent></Card>}
        <Card className={`min-h-[400px] ${!clonerResult && 'flex items-center justify-center'}`}>
          <CardHeader className="w-full flex flex-row items-center justify-between">
            <div className="flex items-center gap-3"><LinkIcon className="h-6 w-6" /><CardTitle>Page Preview</CardTitle></div>
            {clonerResult && (
              <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
                <Download className="mr-2 h-4 w-4"/> Download HTML
              </Button>
            )}
          </CardHeader>
          <CardContent className="w-full">
            {!clonerResult && !isClonerLoading && <p className="text-muted-foreground text-center">Cloned page preview will appear here.</p>}
            {isClonerLoading && <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {clonerResult && (<div className="border rounded-md w-full h-[500px] bg-background"><iframe srcDoc={clonerResult.htmlContent} className="w-full h-full" title="Cloned Page Preview" /></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
