
'use client';

import { CvssCalculator } from '@/components/cvss-calculator';
import { ConfigAnalyzer } from '@/components/config-analyzer';
import { ExploitChainAssistant } from '@/components/exploit-chain-assistant';
import { InjectionScanner } from '@/components/injection-scanner';
import { HeaderAnalyzer } from '@/components/header-analyzer';

export default function VaptPage() {

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Vulnerability Analysis</h1>
        <p className="text-muted-foreground">A suite of tools for vulnerability assessment and penetration testing analysis.</p>
      </div>

      <InjectionScanner />
      <HeaderAnalyzer />
      <ExploitChainAssistant />
      <ConfigAnalyzer />
      <CvssCalculator />

    </div>
  );
}
