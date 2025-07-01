'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { APP_MODULES } from '@/lib/constants';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ActivityFeed } from '@/components/activity-feed';
import { ActiveCampaigns } from '@/components/active-campaigns';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const accessibleModules = APP_MODULES.filter(
    (module) => module.roles.includes(user.role) && module.name !== 'Dashboard' && module.name !== 'Settings'
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Welcome, {user.username}</h1>
        <p className="text-muted-foreground">Here is your operational dashboard.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg bg-primary/30">
                  <p className="text-sm text-muted-foreground">Your Role</p>
                  <p className="text-xl font-bold text-accent">{user.role}</p>
                </div>
                 <div className="p-4 rounded-lg bg-primary/30">
                  <p className="text-sm text-muted-foreground">Security Level</p>
                  <p className="text-xl font-bold text-green-400">Nominal</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <ActiveCampaigns />
        </div>
      </div>
      
      <div>
        <h2 className="font-headline text-2xl font-semibold mb-4">Your Toolkit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accessibleModules.map((module) => (
            <Link href={module.path} key={module.path}>
              <Card className="h-full hover:border-accent hover:bg-card/80 transition-all group">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">{module.name}</CardTitle>
                  <module.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">Access the {module.name} toolkit.</p>
                  <div className="text-sm font-medium text-accent flex items-center gap-1">
                    Open Module <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
