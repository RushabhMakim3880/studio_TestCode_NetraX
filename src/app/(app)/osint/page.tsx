
'use client';

import { SocialMediaAnalyzer } from '@/components/social-media-analyzer';
import { GoogleDorkGenerator } from '@/components/google-dork-generator';
import { ShodanDorkGenerator } from '@/components/shodan-dork-generator';
import { BreachDataChecker } from '@/components/breach-data-checker';

export default function OsintPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">OSINT Investigator</h1>
        <p className="text-muted-foreground">Gather open-source intelligence on targets.</p>
      </div>
      
      <BreachDataChecker />
      <SocialMediaAnalyzer />
      <GoogleDorkGenerator />
      <ShodanDorkGenerator />
    </div>
  );
}
