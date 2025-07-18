
'use client';

import { useAuth } from '@/hooks/use-auth';
import { ActivityFeed } from '@/components/activity-feed';
import { SystemInfo } from '@/components/dashboard/system-info';
import { ThreatIntelSummary } from '@/components/dashboard/threat-intel-summary';
import { UserStats } from '@/components/dashboard/user-stats';
import { ROLES } from '@/lib/constants';
import { NetworkStatus } from '@/components/dashboard/network-status';
import { TaskStatusChart } from '@/components/dashboard/task-status-chart';
import { UserRoleChart } from '@/components/dashboard/user-role-chart';
import { ProjectsBarChart } from '@/components/dashboard/projects-bar-chart';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  const isAdmin = user.role === ROLES.ADMIN;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
        <div className="xl:col-span-1 flex flex-col gap-6">
            <SystemInfo />
            <NetworkStatus />
            {isAdmin && <UserStats />}
        </div>
        <div className="xl:col-span-2 flex flex-col gap-6">
            <ProjectsBarChart />
            <div className="grid md:grid-cols-2 gap-6">
                <TaskStatusChart />
                <UserRoleChart />
            </div>
        </div>
        <div className="xl:col-span-1 flex flex-col gap-6">
            <ThreatIntelSummary />
            <ActivityFeed />
        </div>
    </div>
  );
}
