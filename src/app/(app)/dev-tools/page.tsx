'use client';

import { BuiltWithScanner } from '@/components/built-with-scanner';
import { InjectionScanner } from '@/components/injection-scanner';
import { PortScanner } from '@/components/port-scanner';

export default function DevToolsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Developer Tools</h1>
        <p className="text-muted-foreground">A collection of tools for web and network reconnaissance.</p>
      </div>

      <BuiltWithScanner />
      <PortScanner />
      <InjectionScanner />

    </div>
  );
}
