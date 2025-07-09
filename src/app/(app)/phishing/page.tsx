'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester, type CapturedCredential } from '@/components/credential-harvester';
import { PhishingCampaignLauncher } from '@/components/phishing-campaign-launcher';
import { EmailGenerator } from '@/components/email-generator';
import { LoginPageCloner } from '@/components/login-page-cloner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PhishingPage() {
  const { toast } = useToast();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);

  const loadCredentialsFromStorage = () => {
    try {
        const storedCreds = localStorage.getItem('netra-credentials');
        if (storedCreds) {
            setCapturedCredentials(JSON.parse(storedCreds));
        }
    } catch (error) {
        console.error('Failed to load credentials from localStorage', error);
    }
  };

  // Effect for initial load from localStorage
  useEffect(() => {
    loadCredentialsFromStorage();
  }, []);

  // Effect for real-time updates from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'netra-credentials') {
        const newCredsRaw = event.newValue;
        if (newCredsRaw) {
          try {
            const newCreds = JSON.parse(newCredsRaw);
            // Use functional update to get the latest state
            setCapturedCredentials(currentCreds => {
              if (newCreds.length > currentCreds.length) {
                const newCredential = newCreds[newCreds.length - 1];
                const summary = Object.entries(newCredential)
                    .filter(([key]) => key !== 'timestamp')
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');

                toast({
                  variant: "destructive",
                  title: "Credentials Captured!",
                  description: summary || "A form was submitted.",
                });
              }
              return newCreds;
            });
          } catch (e) {
            console.error('Failed to parse updated credentials', e);
          }
        } else {
          // Handle log clearing from another tab
          setCapturedCredentials([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [toast]);

  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem('netra-credentials');
  };

  const handleRefreshCredentials = () => {
    loadCredentialsFromStorage();
    toast({ title: "Log Refreshed" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Phishing Campaign Simulator</h1>
        <p className="text-muted-foreground">Craft landing pages, generate emails, and manage campaigns.</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          <LoginPageCloner />
        </div>
        <div className="flex flex-col gap-6">
          <CredentialHarvester 
            credentials={capturedCredentials} 
            onClear={handleClearCredentials} 
            onRefresh={handleRefreshCredentials} 
          />
        </div>
      </div>

      <Tabs defaultValue="email-generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email-generator">Email Generator</TabsTrigger>
          <TabsTrigger value="campaign-launcher">Campaign Launcher</TabsTrigger>
        </TabsList>
        <TabsContent value="email-generator" className="mt-4">
          <EmailGenerator />
        </TabsContent>
         <TabsContent value="campaign-launcher" className="mt-4">
            <PhishingCampaignLauncher />
        </TabsContent>
      </Tabs>
    </div>
  );
}
