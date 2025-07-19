
'use client';

import { SocialMediaAnalyzer } from '@/components/social-media-analyzer';
import { GoogleDorkGenerator } from '@/components/google-dork-generator';
import { ShodanDorkGenerator } from '@/components/shodan-dork-generator';
import { BreachDataChecker } from '@/components/breach-data-checker';
import { MetadataScrubber } from '@/components/metadata-scrubber';
import { EmailHeaderAnalyzer } from '@/components/email-header-analyzer';
import { DataObfuscator } from '@/components/data-obfuscator';
import { IocExtractor } from '@/components/ioc-extractor';

export default function OsintPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">OSINT Investigator</h1>
        <p className="text-muted-foreground">A collection of tools for open-source intelligence gathering and data analysis.</p>
      </div>
      
      <BreachDataChecker />
      <SocialMediaAnalyzer />
      <IocExtractor />
      <DataObfuscator />
      <MetadataScrubber />
      <EmailHeaderAnalyzer />
      <GoogleDorkGenerator />
      <ShodanDorkGenerator />
    </div>
  );
}
