
'use client';

import { useAuth } from '@/hooks/use-auth';
import { AppearanceSettings } from '@/components/appearance-settings';
import { CompanyProfileManager } from '@/components/company-profile-manager';
import { CustomThemeGenerator } from '@/components/custom-theme-generator';
import { EmailSettings } from '@/components/email-settings';
import { ApiKeysManager } from '@/components/api-keys-manager';
import { PageSettingsManager } from '@/components/settings/page-settings-manager';
import { LocalAiProviderManager } from '@/components/local-ai-provider-manager';
import { Accordion } from '@/components/ui/accordion';
import { OffensiveSettings } from '@/components/settings/offensive-settings';
import { ScanningSettings } from '@/components/settings/scanning-settings';
import { ReportingSettings } from '@/components/settings/reporting-settings';
import { GlobalAppSettings } from '@/components/settings/global-app-settings';

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
        <PageSettingsManager />
        <AppearanceSettings />
        <OffensiveSettings />
        <ScanningSettings />
        <ReportingSettings />
        <GlobalAppSettings />
        <ApiKeysManager />
        <LocalAiProviderManager />
        <EmailSettings />
        <CustomThemeGenerator />
        <CompanyProfileManager />
      </Accordion>
      
    </div>
  );
}
