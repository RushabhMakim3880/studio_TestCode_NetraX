
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester, type CapturedCredential } from '@/components/credential-harvester';
import { LoginPageCloner } from '@/components/login-page-cloner';
import { useRouter } from 'next/navigation';

// In-memory store for passing HTML to the preview page.
// In a real multi-user app, this would be managed more robustly (e.g., Redis, DB).
const pageStore = new Map<string, string>();

export function storeClonedPage(htmlContent: string): string {
    const id = crypto.randomUUID();
    pageStore.set(id, htmlContent);
    // Auto-expire the page data to prevent memory leaks
    setTimeout(() => pageStore.delete(id), 5 * 60 * 1000); // 5 minutes
    return id;
}

export function retrieveClonedPage(id: string): string | undefined {
    return pageStore.get(id);
}


export default function PhishingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);
  const storageKey = 'netra-captured-credentials';

  const loadCredentialsFromStorage = () => {
    try {
        const storedCreds = localStorage.getItem(storageKey);
        if (storedCreds) {
            setCapturedCredentials(JSON.parse(storedCreds));
        } else {
            setCapturedCredentials([]);
        }
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
      if (event.key === storageKey) {
        const newCredsRaw = event.newValue;
        if (newCredsRaw) {
          try {
            const newCreds = JSON.parse(newCredsRaw);
            const currentLength = capturedCredentials.length;

            setCapturedCredentials(newCreds); 

            if (newCreds.length > currentLength) {
                const newCredential = newCreds[newCreds.length - 1];
                const summary = Object.entries(newCredential)
                    .filter(([key]) => key !== 'timestamp' && key !== 'source')
                    .map(([key, value]) => `${key}: ${String(value).substring(0,20)}`)
                    .join(', ');

                toast({
                  variant: "destructive",
                  title: "Credentials Captured!",
                  description: summary || "A form was submitted.",
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
  }, [toast, capturedCredentials.length]); 

  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem(storageKey);
  };

  const handleRefreshCredentials = () => {
    loadCredentialsFromStorage();
    toast({ title: "Log Refreshed" });
  };
  
  const handleHostPage = (htmlContent: string) => {
    const pageId = storeClonedPage(htmlContent);
    const url = `/phishing/${pageId}`;
    
    // Programmatically "host" the page by navigating to its viewer
    // and passing the content via the simple in-memory store.
    router.push(url);
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
        </div>
        <div className="flex flex-col gap-6">
          <CredentialHarvester 
            credentials={capturedCredentials} 
            onClear={handleClearCredentials} 
            onRefresh={handleRefreshCredentials} 
          />
        </div>
      </div>
    </div>
  );
}
