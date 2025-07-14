
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester, type CapturedCredential } from '@/components/credential-harvester';
import { LoginPageCloner } from '@/components/login-page-cloner';
import { QrCodeGenerator } from '@/components/qr-code-generator';

export default function PhishingPage() {
  const { toast } = useToast();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);
  const [hostedPageUrl, setHostedPageUrl] = useState<string | null>(null);
  const storageKey = 'netra-captured-credentials';
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadCredentialsFromStorage();
  }, []);

  const loadCredentialsFromStorage = () => {
    if (typeof window === 'undefined') return;
    try {
        const storedCreds = localStorage.getItem(storageKey);
        setCapturedCredentials(storedCreds ? JSON.parse(storedCreds) : []);
    } catch (error) {
        console.error('Failed to load credentials from localStorage', error);
        setCapturedCredentials([]);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey) {
        const newCredsRaw = event.newValue;
        const currentCreds = capturedCredentials;

        if (newCredsRaw) {
          try {
            const newCredsList: CapturedCredential[] = JSON.parse(newCredsRaw);
            setCapturedCredentials(newCredsList); 

            if (newCredsList.length > currentCreds.length) {
                const newCredential = newCredsList[newCredsList.length - 1];
                const summary = Object.entries(newCredential)
                    .filter(([key]) => key !== 'timestamp' && key !== 'source')
                    .map(([key, value]) => `${key}: ${String(value).substring(0,20)}...`)
                    .join(', ');

                toast({
                  variant: "destructive",
                  title: "Credentials Captured!",
                  description: summary || "A form was submitted on a cloned page.",
                });
            }
          } catch (e) {
            console.error('Failed to parse updated credentials', e);
          }
        } else {
          setCapturedCredentials([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [toast, capturedCredentials]);

  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem(storageKey);
  };
  
  const handleHostPage = (htmlContent: string) => {
    try {
      const pageId = crypto.randomUUID();
      const storageKey = `phishing-page-${pageId}`;
      
      // Store the page content in localStorage
      localStorage.setItem(storageKey, htmlContent);
      
      // Remove the content after a reasonable time to prevent localStorage bloat
      setTimeout(() => localStorage.removeItem(storageKey), 10 * 60 * 1000); // 10 minutes

      // Open the viewer page in a new tab
      const url = `/phishing/${pageId}`;
      window.open(url, '_blank');

      if (isClient) {
          setHostedPageUrl(window.location.origin + url);
      }

      toast({ title: "Page Hosted", description: "Cloned page opened in a new tab."});

    } catch (e) {
        console.error("Failed to host page in localStorage", e);
        toast({ variant: 'destructive', title: "Hosting Failed", description: "Could not save page content to browser storage." });
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
          <LoginPageCloner onHostPage={handleHostPage} />
          {hostedPageUrl && <QrCodeGenerator url={hostedPageUrl} />}
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
