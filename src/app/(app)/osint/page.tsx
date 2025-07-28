
'use client';

import { SocialMediaAnalyzer } from '@/components/social-media-analyzer';
import { GoogleDorkGenerator } from '@/components/google-dork-generator';
import { WhoisLookup } from '@/components/whois-lookup';
import { DnsLookup } from '@/components/dns-lookup';
import { BreachDataChecker } from '@/components/breach-data-checker';
import { MetadataScrubber } from '@/components/metadata-scrubber';
import { EmailHeaderAnalyzer } from '@/components/email-header-analyzer';
import { DataObfuscator } from '@/components/data-obfuscator';
import { IocExtractor } from '@/components/ioc-extractor';
import { ShodanDorkGenerator } from '@/components/shodan-dork-generator';
import { DarkWebScanner } from '@/components/dark-web-scanner';
import { useAuth } from '@/hooks/use-auth';

export default function OsintPage() {
    const { user } = useAuth();
    const settings = user?.userSettings?.scanning;

    if (!settings) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">OSINT Investigator</h1>
        <p className="text-muted-foreground">A collection of tools for open-source intelligence gathering and data analysis.</p>
      </div>
      
      {settings.showDarkWebScanner && <DarkWebScanner />}
      {settings.showWhois && <WhoisLookup />}
      {settings.showDns && <DnsLookup />}
      {settings.showBreachCheck && <BreachDataChecker />}
      {settings.showSocialMedia && <SocialMediaAnalyzer />}
      {settings.showIocExtractor && <IocExtractor />}
      {settings.showDataObfuscator && <DataObfuscator />}
      {settings.showMetadataScrubber && <MetadataScrubber />}
      {settings.showEmailHeaderAnalyzer && <EmailHeaderAnalyzer />}
      {settings.showGoogleDorker && <GoogleDorkGenerator />}
      {settings.showShodanDorker && <ShodanDorkGenerator />}
    </div>
  );
}
