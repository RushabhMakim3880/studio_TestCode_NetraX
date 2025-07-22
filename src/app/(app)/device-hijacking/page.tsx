'use client';

import { WebcamHijackTool } from '@/components/webcam-hijack-tool';

export default function DeviceHijackingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Device Hijacking</h1>
        <p className="text-muted-foreground">Tools for exploiting browser permissions to access local hardware.</p>
      </div>

      <WebcamHijackTool />
    </div>
  );
}
