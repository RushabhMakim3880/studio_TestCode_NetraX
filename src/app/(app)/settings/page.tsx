
'use client';

import { useAuth } from '@/hooks/use-auth';
import { AppearanceSettings } from '@/components/appearance-settings';
import { CompanyProfileManager } from '@/components/company-profile-manager';
import { CustomThemeGenerator } from '@/components/custom-theme-generator';
import { EmailSettings } from '@/components/email-settings';
import { ApiKeysManager } from '@/components/api-keys-manager';
import { PageSettingsManager } from '@/components/settings/page-settings-manager';
import { LocalAiProviderManager } from '@/components/local-ai-provider-manager';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { OffensiveSettings } from '@/components/settings/offensive-settings';
import { ScanningSettings } from '@/components/settings/scanning-settings';
import { ReportingSettings } from '@/components/settings/reporting-settings';
import { GlobalAppSettings } from '@/components/settings/global-app-settings';
import { SecuritySettings } from '@/components/settings/security-settings';
import { DataPrivacySettings } from '@/components/settings/data-privacy-settings';
import { NotificationsSettings } from '@/components/settings/notifications-settings';
import { BrainCircuit } from 'lucide-react';

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
        <AppearanceSettings />
        <OffensiveSettings />
        <ScanningSettings />
        <ReportingSettings />
        <GlobalAppSettings />
        <DataPrivacySettings />
        <NotificationsSettings />
        <ApiKeysManager />
        <AccordionItem value="local-ai-settings">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">Local AI Provider</p>
                <p className="text-sm text-muted-foreground font-normal">Integrate local LLMs like Ollama.</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 border-t">
              <LocalAiProviderManager />
            </div>
          </AccordionContent>
        </AccordionItem>
        <EmailSettings />
        <CustomThemeGenerator />
        <CompanyProfileManager />
      </Accordion>
      
    </div>
  );
}
