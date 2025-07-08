'use client';

import { useAuth } from '@/hooks/use-auth';
import { ActivityFeed } from '@/components/activity-feed';
import { ActiveProjects } from '@/components/active-projects';
import { SystemInfo } from '@/components/dashboard/system-info';
import { NetworkInfo } from '@/components/dashboard/network-info';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('@/components/dashboard/globe').then(m => m.Globe), {
    ssr: false,
    loading: () => (
      <Card className="h-full flex items-center justify-center bg-card/50">
          <Skeleton className="w-48 h-48 rounded-full" />
      </Card>
    ),
});


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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-grow min-h-[400px]">
          <div className="lg:col-span-3 h-[400px] lg:h-auto">
              <Globe />
          </div>
          <div className="lg:col-span-2">
              <ActivityFeed />
          </div>
      </div>
    </div>
  );
}
