'use client';

import { MetadataScrubber } from '@/components/metadata-scrubber';
import { EmailHeaderAnalyzer } from '@/components/email-header-analyzer';
import { DataObfuscator } from '@/components/data-obfuscator';

export default function AnonymizationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Anonymization Toolkit</h1>
        <p className="text-muted-foreground">Tools for operational security, privacy, and data protection.</p>
      </div>
      
      <MetadataScrubber />
      <EmailHeaderAnalyzer />
      <DataObfuscator />
    </div>
  );
}
