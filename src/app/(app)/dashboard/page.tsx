'use client';

import { useAuth } from '@/hooks/use-auth';
import { ActivityFeed } from '@/components/activity-feed';
import { ActiveProjects } from '@/components/active-projects';
import { SystemInfo } from '@/components/dashboard/system-info';
import { NetworkInfo } from '@/components/dashboard/network-info';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SystemInfo />
          <NetworkInfo />
          <ActiveProjects />
      </div>
      <div className="grid grid-cols-1 flex-grow">
          <ActivityFeed />
      </div>
    </div>
  );
}
