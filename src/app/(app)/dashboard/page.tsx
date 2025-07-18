
'use client';

import { useAuth } from '@/hooks/use-auth';
import { ActivityFeed } from '@/components/activity-feed';
import { ActiveProjects } from '@/components/active-projects';
import { SystemInfo } from '@/components/dashboard/system-info';
import { ThreatIntelSummary } from '@/components/dashboard/threat-intel-summary';
import { UserStats } from '@/components/dashboard/user-stats';
import { ROLES } from '@/lib/constants';
import { NetworkStatus } from '@/components/dashboard/network-status';
import ActiveCampaigns from '@/components/active-campaigns';
import { ComplianceAndLegalReference } from '@/components/compliance-legal-reference';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  const isAdmin = user.role === ROLES.ADMIN;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 grid grid-cols-1 gap-6 content-start">
            <div className="grid md:grid-cols-2 gap-6">
                <SystemInfo />
                <NetworkStatus />
                <ThreatIntelSummary />
                <ActiveProjects />
                {isAdmin && <UserStats />}
            </div>
            <ActiveCampaigns />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <ActivityFeed />
            <ComplianceAndLegalReference />
        </div>
    </div>
  );
}
