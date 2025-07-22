
'use client';

import { PhishingCampaignLauncher } from '@/components/phishing-campaign-launcher';

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Phishing Campaigns</h1>
        <p className="text-muted-foreground">Launch and monitor simulated phishing campaigns against your targets.</p>
      </div>

      <PhishingCampaignLauncher />

    </div>
  );
}
