
'use client';

import { DomainMonitor } from '@/components/domain-monitor';
import { PhishingSiteScanner } from '@/components/phishing-site-scanner';
import { WebhookMonitor } from '@/components/webhook-monitor';

export default function PhishingDefensePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Phishing Defense Center</h1>
        <p className="text-muted-foreground">A suite of tools to detect, analyze, and monitor phishing threats against your organization.</p>
      </div>

      <PhishingSiteScanner />
      <DomainMonitor />
      <WebhookMonitor />
    </div>
  );
}
