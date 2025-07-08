'use client';

import { FirmwareAnalyzer } from '@/components/firmware-analyzer';
import { IotTrafficAnalyzer } from '@/components/iot-traffic-analyzer';

export default function IotSecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">IoT Security Toolkit</h1>
        <p className="text-muted-foreground">Tools for analyzing and assessing the security of IoT devices.</p>
      </div>

      <FirmwareAnalyzer />
      <IotTrafficAnalyzer />

    </div>
  );
}
