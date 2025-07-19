
'use client';

import { DnsLookup } from '@/components/dns-lookup';
import { RealPortScanner } from '@/components/real-port-scanner';
import { SubdomainScanner } from '@/components/subdomain-scanner';
import { WhoisLookup } from '@/components/whois-lookup';

export default function NetworkAnalysisPage() {

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Network Investigation</h1>
        <p className="text-muted-foreground">Tools for live network reconnaissance and analysis.</p>
      </div>

      <WhoisLookup />
      <DnsLookup />
      <SubdomainScanner />
      <RealPortScanner />
    </div>
  );
}
