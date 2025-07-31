
'use client';

// This page is deprecated. Its functionality is now part of the
// Live Session Tracker page, which has a more robust implementation.
// This page can be removed in a future update.

export default function DeviceHijackingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Device Hijacking (Deprecated)</h1>
        <p className="text-muted-foreground">This module has been deprecated. Please use the Live Tracker for media hijacking.</p>
      </div>
    </div>
  );
}
