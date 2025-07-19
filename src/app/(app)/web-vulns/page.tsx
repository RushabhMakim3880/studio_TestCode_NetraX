
'use client';

import { XssInjector } from '@/components/xss-injector';

export default function WebVulnerabilitiesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Web Vulnerabilities</h1>
        <p className="text-muted-foreground">A collection of tools for web application penetration testing.</p>
      </div>
      
      <XssInjector />

    </div>
  );
}
