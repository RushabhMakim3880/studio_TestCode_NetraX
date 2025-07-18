'use client';

import { ThreatActorProfiler } from '@/components/threat-actor-profiler';
import { CveFeed } from '@/components/cve-feed';

export default function ThreatIntelPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Threat Intelligence</h1>
        <p className="text-muted-foreground">Monitor threat actors and track the latest vulnerabilities.</p>
      </div>

      <ThreatActorProfiler />
      <CveFeed />
    </div>
  );
}
