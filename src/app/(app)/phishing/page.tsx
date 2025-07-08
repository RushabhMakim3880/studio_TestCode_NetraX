
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester, type CapturedCredential } from '@/components/credential-harvester';
import { PhishingCampaignLauncher } from '@/components/phishing-campaign-launcher';
import { EmailGenerator } from '@/components/email-generator';
import { LoginPageCloner } from '@/components/login-page-cloner';

export default function PhishingPage() {
  const { toast } = useToast();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);

  useEffect(() => {
    try {
        const storedCreds = localStorage.getItem('netra-credentials');
        if (storedCreds) {
            setCapturedCredentials(JSON.parse(storedCreds));
        }
    } catch (error) {
        console.error('Failed to load credentials from localStorage', error);
    }

    const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'credential-capture') {
            const { username, password } = event.data;
            const newCredential: CapturedCredential = {
                username,
                password,
                timestamp: Date.now(),
            };
            
            setCapturedCredentials(prevCreds => {
                const updatedCreds = [...prevCreds, newCredential];
                localStorage.setItem('netra-credentials', JSON.stringify(updatedCreds));
                return updatedCreds;
            });

            toast({
                variant: "destructive",
                title: "Credentials Captured!",
                description: `Username: ${username}`,
            });
        }
    };

    window.addEventListener('message', handleMessage);

    return () => {
        window.removeEventListener('message', handleMessage);
    };
  }, [toast]);

  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem('netra-credentials');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Phishing Campaign Simulator</h1>
        <p className="text-muted-foreground">Craft custom emails and clone login pages.</p>
      </div>
      <Tabs defaultValue="email-generator" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="email-generator">Email Generator</TabsTrigger>
          <TabsTrigger value="page-cloner">Login Page Cloner</TabsTrigger>
          <TabsTrigger value="harvester">
            Credential Harvester
            {capturedCredentials.length > 0 && <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">{capturedCredentials.length}</span>}
          </TabsTrigger>
           <TabsTrigger value="campaign-launcher">Campaign Launcher</TabsTrigger>
        </TabsList>
        <TabsContent value="email-generator" className="mt-4">
          <EmailGenerator />
        </TabsContent>
        <TabsContent value="page-cloner" className="mt-4">
          <LoginPageCloner />
        </TabsContent>
        <TabsContent value="harvester" className="mt-4">
            <CredentialHarvester credentials={capturedCredentials} onClear={handleClearCredentials} />
        </TabsContent>
         <TabsContent value="campaign-launcher" className="mt-4">
            <PhishingCampaignLauncher />
        </TabsContent>
      </Tabs>
    </div>
  );
}
