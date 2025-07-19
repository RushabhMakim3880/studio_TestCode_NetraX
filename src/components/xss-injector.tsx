
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
import { startNgrokTunnel } from '@/services/ngrok-service';
import { logActivity } from '@/services/activity-log-service';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

const formSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  xssPayload: z.string().min(1, 'XSS Payload cannot be empty.'),
});

export function XssInjector() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHosting, setIsHosting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetUrl: 'https://public-firing-range.appspot.com/address/location.html',
      xssPayload: "<script>alert('XSS Demo: ' + document.domain)</script>",
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
      
      if (html.includes('</body>')) {
          html = html.replace(/<\/body>/i, `${values.xssPayload}</body>`);
      } else {
          html += values.xssPayload;
      }
      
      setModifiedHtml(html);
      toast({ title: 'Injection Complete', description: 'XSS payload has been injected into the DOM.' });
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
      toast({ title: "Generating Public Link...", description: "Starting ngrok tunnel. This may take a moment." });
      const { url } = await startNgrokTunnel();

      if (url) {
        const pageId = crypto.randomUUID();
        const pageStorageKey = `phishing-html-${pageId}`; // Reuse the same mechanism as phishing pages
        localStorage.setItem(pageStorageKey, modifiedHtml);

        const finalUrl = `${url}/phish/${pageId}`;
        setHostedUrl(finalUrl);
        toast({ title: "Public Link Generated!", description: "Your attack page is now live." });

        logActivity({
            user: user?.displayName || 'Operator',
            action: 'Created XSS Attack URL',
            details: `Target: ${form.getValues('targetUrl')}`,
        });
      } else {
         throw new Error("Ngrok did not return a URL.");
      }
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
        <CardTitle>DOM Cloner &amp; XSS Injector</CardTitle>
        <CardDescription>Clone a live webpage and inject a custom XSS payload to test for vulnerabilities.</CardDescription>
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
              name="xssPayload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>XSS Payload</FormLabel>
                  <FormControl>
                    <Textarea placeholder="<script>alert(1)</script>" {...field} className="font-mono"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                    Clone &amp; Inject
                </Button>
                <Button type="button" onClick={handleGenerateLink} disabled={!modifiedHtml || isHosting} className="w-full sm:w-auto">
                    {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                    Generate Attack URL
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      {hostedUrl && (
          <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            <h3 className="font-semibold">Live Attack URL</h3>
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
