
'use client';

import { RealPortScanner } from '@/components/real-port-scanner';
import { SubdomainScanner } from '@/components/subdomain-scanner';
import { useAuth } from '@/hooks/use-auth';

export default function NetworkInvestigationPage() {
    const { user } = useAuth();
    const settings = user?.userSettings?.scanning;

    if (!settings) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Network Investigation</h1>
        <p className="text-muted-foreground">Tools for live network reconnaissance and analysis.</p>
      </div>

      {settings.showSubdomainScanner && <SubdomainScanner />}
      {settings.showRealPortScanner && <RealPortScanner />}
    </div>
  );
}
