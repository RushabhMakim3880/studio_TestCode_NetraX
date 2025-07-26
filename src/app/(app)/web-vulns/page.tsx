
'use client';

// This page is deprecated. The XssInjector component has been removed
// in favor of the more advanced payload generation tools on the
// Live Session Tracker page. This page can be removed in a future update.

export default function WebVulnerabilitiesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Web Vulnerabilities</h1>
        <p className="text-muted-foreground">This module has been deprecated. Please use the Live Tracker for payload injection.</p>
      </div>
    </div>
  );
}
