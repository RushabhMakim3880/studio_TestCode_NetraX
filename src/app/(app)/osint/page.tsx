'use client';

import { SocialMediaAnalyzer } from '@/components/social-media-analyzer';
import { GoogleDorkGenerator } from '@/components/google-dork-generator';
import { ShodanDorkGenerator } from '@/components/shodan-dork-generator';
import { BreachDataChecker } from '@/components/breach-data-checker';
import { WhoisLookup } from '@/components/whois-lookup';
import { DnsLookup } from '@/components/dns-lookup';
import { SubdomainScanner } from '@/components/subdomain-scanner';

export default function OsintPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">OSINT Investigator</h1>
        <p className="text-muted-foreground">A collection of tools for open-source intelligence gathering.</p>
      </div>
      
      <WhoisLookup />
      <DnsLookup />
      <SubdomainScanner />
      <BreachDataChecker />
      <SocialMediaAnalyzer />
      <GoogleDorkGenerator />
      <ShodanDorkGenerator />
    </div>
  );
}
