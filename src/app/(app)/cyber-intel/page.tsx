
'use client';

import { CyberIntelPageContent } from '@/components/cyber-intel-page-content';

export default function CyberIntelPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Cyber Intelligence</h1>
        <p className="text-muted-foreground">Monitor and analyze the latest cyber threats and gather open-source intelligence.</p>
      </div>

      <CyberIntelPageContent />

    </div>
  );
}
