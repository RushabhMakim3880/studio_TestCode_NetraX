'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getOnionPage, type OnionPageOutput } from '@/ai/flows/dark-web-page-flow';
import { Loader2, Globe, Lock, ArrowRight, RefreshCw, Home } from 'lucide-react';

const formSchema = z.object({
  onionAddress: z.string().min(16, { message: 'Enter a valid .onion address.' }).regex(/\.onion$/, { message: 'Address must end with .onion' }),
});

const defaultAddress = "dreadforumc23se2.onion";

export function DarkWebBrowser() {
  const [pageContent, setPageContent] = useState<OnionPageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      onionAddress: defaultAddress,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setPageContent(null);
    try {
      const response = await getOnionPage(values);
      setPageContent(response);
    } catch (err) {
      setError('Failed to load page. The address may be offline or the content was blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleRefresh = () => {
      if (form.getValues('onionAddress')) {
          onSubmit(form.getValues());
      }
  }

  const handleHome = () => {
    form.setValue('onionAddress', defaultAddress);
    onSubmit({ onionAddress: defaultAddress });
  }

  return (
    <Card className="flex flex-col h-[80vh]">
      <div className="flex-none p-2 border-b bg-primary/10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleHome}><Home className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></Button>
            <div className="relative flex-grow">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
              <FormField
                control={form.control}
                name="onionAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter a .onion address..."
                        className="font-mono bg-background pl-9"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" size="icon" disabled={isLoading}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
      <CardContent className="flex-grow p-0">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Connecting to Tor network (simulation)...</p>
            <p className="text-sm font-mono">{form.getValues('onionAddress')}</p>
          </div>
        )}
        {error && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
                <Globe className="h-12 w-12" />
                <h3 className="font-bold text-lg">Unable to connect</h3>
                <p className="text-sm">{error}</p>
            </div>
        )}
        {!isLoading && !error && !pageContent && (
             <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <Globe className="h-12 w-12" />
                <h3 className="font-bold text-lg">Dark Web Browser</h3>
                <p className="text-sm">Enter a simulated .onion address to begin.</p>
            </div>
        )}
        {pageContent && (
          <iframe
            srcDoc={pageContent.htmlContent}
            title={pageContent.pageTitle}
            className="w-full h-full border-0"
            sandbox="allow-scripts" // Be careful with sandbox attributes
          />
        )}
      </CardContent>
    </Card>
  );
}
