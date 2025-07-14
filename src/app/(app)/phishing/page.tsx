
'use client';

import { PhishingCampaignLauncher } from '@/components/phishing-campaign-launcher';

export default function PhishingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Phishing Campaign Simulator</h1>
        <p className="text-muted-foreground">Launch and manage interactive phishing simulations against target profiles.</p>
      </div>
      
      <PhishingCampaignLauncher />

    </div>
  );
}
