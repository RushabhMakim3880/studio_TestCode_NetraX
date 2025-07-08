'use client';

import { AnonymizationTool } from '@/components/anonymization-tool';

export default function AnonymizationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Anonymization Toolkit</h1>
        <p className="text-muted-foreground">Simulate routing traffic through VPNs and proxy chains to obscure your origin.</p>
      </div>

      <AnonymizationTool />

    </div>
  );
}
