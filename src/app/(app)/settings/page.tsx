
'use client';

import { useAuth } from '@/hooks/use-auth';
import { AppearanceSettings } from '@/components/appearance-settings';
import { CompanyProfileManager } from '@/components/company-profile-manager';
import { CustomThemeGenerator } from '@/components/custom-theme-generator';
import { EmailSettings } from '@/components/email-settings';
import { ApiKeysManager } from '@/components/api-keys-manager';
import { PageSettingsManager } from '@/components/settings/page-settings-manager';

export default function SettingsPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and modules.</p>
      </div>

      <ApiKeysManager />
      <EmailSettings />
      <PageSettingsManager />
      <AppearanceSettings />
      <CustomThemeGenerator />
      <CompanyProfileManager />
      
    </div>
  );
}
