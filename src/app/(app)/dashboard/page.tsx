
'use client';

import { useAuth } from '@/hooks/use-auth';
import { ActivityFeed } from '@/components/activity-feed';
import { ActiveProjects } from '@/components/active-projects';
import { SystemInfo } from '@/components/dashboard/system-info';
import { ThreatIntelSummary } from '@/components/dashboard/threat-intel-summary';
import { UserStats } from '@/components/dashboard/user-stats';
import { ROLES } from '@/lib/constants';
import { NetworkStatus } from '@/components/dashboard/network-status';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  const isAdmin = user.role === ROLES.ADMIN;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className={`grid grid-cols-1 lg:grid-cols-${isAdmin ? '5' : '4'} gap-4`}>
          <SystemInfo />
          <NetworkStatus />
          <ThreatIntelSummary />
          <ActiveProjects />
          {isAdmin && <UserStats />}
      </div>
      <div className="grid grid-cols-1 flex-grow">
          <ActivityFeed />
      </div>
    </div>
  );
}
