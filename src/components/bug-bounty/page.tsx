
'use client';

import { IdorScanner } from '@/components/idor-scanner';
import { ReportFormatter } from '@/components/report-formatter';
import { useAuth } from '@/hooks/use-auth';

export default function BugBountyPage() {
    const { user } = useAuth();
    const settings = user?.userSettings?.scanning;
    const reportingSettings = user?.userSettings?.reporting;

    if (!settings || !reportingSettings) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Bug Bounty Toolkit</h1>
        <p className="text-muted-foreground">A collection of tools to assist with bug bounty hunting and reporting.</p>
      </div>

      {settings.showIdorScanner && <IdorScanner />}
      {reportingSettings.showReportFormatter && <ReportFormatter />}
    </div>
  );
}
