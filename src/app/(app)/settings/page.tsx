
'use client';

import { useAuth } from '@/hooks/use-auth';
import { EmailSettings } from '@/components/email-settings';
import { ApiKeysManager } from '@/components/api-keys-manager';
import { PageSettingsManager } from '@/components/settings/page-settings-manager';
import { LocalAiSettings } from '@/components/local-ai-settings';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { OffensiveSettings } from '@/components/settings/offensive-settings';
import { ScanningSettings } from '@/components/settings/scanning-settings';
import { ReportingSettings } from '@/components/settings/reporting-settings';
import { GlobalAppSettings } from '@/components/settings/global-app-settings';
import { SecuritySettings } from '@/components/settings/security-settings';
import { DataPrivacySettings } from '@/components/settings/data-privacy-settings';
import { NotificationsSettings } from '@/components/settings/notifications-settings';
import { BrainCircuit, KeyRound, Mail, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and modules.</p>
      </div>
      
      <Accordion type="multiple" className="w-full space-y-4">
        {user.role === 'Admin' && <SecuritySettings />}
        <PageSettingsManager />
        <OffensiveSettings />
        <ScanningSettings />
        <ReportingSettings />
        <GlobalAppSettings />
        <DataPrivacySettings />
        <NotificationsSettings />
        
        <AccordionItem value="api-keys">
            <AccordionTrigger>
                <div className="flex items-center gap-3">
                    <KeyRound className="h-6 w-6" />
                    <div className="text-left">
                        <p className="font-semibold">API Key Management</p>
                        <p className="text-sm text-muted-foreground font-normal">Manage third-party API keys for integrated tools.</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="p-4 border-t">
                    <ApiKeysManager />
                </div>
            </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="local-ai-settings">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">Local AI Provider</p>
                <p className="text-sm text-muted-foreground font-normal">Configure a local Ollama instance for AI tasks.</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 border-t">
              <LocalAiSettings />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="email-settings">
            <AccordionTrigger>
                <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6" />
                    <div className="text-left">
                        <p className="font-semibold">Email SMTP Settings</p>
                        <p className="text-sm text-muted-foreground font-normal">Configure SMTP for sending email invites and reports.</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="p-4 border-t">
                    <EmailSettings />
                </div>
            </AccordionContent>
        </AccordionItem>
      </Accordion>
      
    </div>
  );
}
