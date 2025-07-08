'use client';

import { DarkWebBrowser } from '@/components/dark-web-browser';
import { DarkWebMonitor } from '@/components/dark-web-monitor';

export default function DarkWebPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Dark Web Toolkit</h1>
        <p className="text-muted-foreground">Simulate monitoring and browsing dark web sources.</p>
      </div>

      <DarkWebBrowser />
      <DarkWebMonitor />

    </div>
  );
}
