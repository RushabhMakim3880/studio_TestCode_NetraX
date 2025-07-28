
'use client';

import { FirmwareAnalyzer } from '@/components/firmware-analyzer';
import { IotTrafficAnalyzer } from '@/components/iot-traffic-analyzer';
import { useAuth } from '@/hooks/use-auth';

export default function IotSecurityPage() {
    const { user } = useAuth();
    const settings = user?.userSettings?.scanning;

    if (!settings) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">IoT Security Toolkit</h1>
        <p className="text-muted-foreground">Tools for analyzing and assessing the security of IoT devices.</p>
      </div>

      {settings.showFirmwareAnalyzer && <FirmwareAnalyzer />}
      {settings.showIotTrafficAnalyzer && <IotTrafficAnalyzer />}

    </div>
  );
}
