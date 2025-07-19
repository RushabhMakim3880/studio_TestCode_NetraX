
'use client';

import { IdorScanner } from '@/components/idor-scanner';
import { ReportFormatter } from '@/components/report-formatter';

export default function BugBountyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Bug Bounty Toolkit</h1>
        <p className="text-muted-foreground">A collection of tools to assist with bug bounty hunting and reporting.</p>
      </div>

      <IdorScanner />
      <ReportFormatter />

    </div>
  );
}
