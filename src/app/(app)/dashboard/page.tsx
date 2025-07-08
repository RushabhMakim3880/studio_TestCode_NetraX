'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { ActivityFeed } from '@/components/activity-feed';
import { ActiveCampaigns } from '@/components/active-campaigns';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from '@/components/ui/chart';

type Campaign = {
  id: string;
  name: string;
  target: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
};

function CampaignStatusChart() {
  const [chartData, setChartData] = useState<{name: string; value: number}[]>([]);

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem('netra-campaigns');
      if (storedCampaigns) {
        const campaigns: Campaign[] = JSON.parse(storedCampaigns);
        const statusCounts = campaigns.reduce((acc, campaign) => {
          acc[campaign.status] = (acc[campaign.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const data = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        setChartData(data);
      }
    } catch (error) {
      console.error('Failed to load campaign data for chart', error);
      setChartData([]);
    }
  }, []);

  const chartConfig = {
    value: {
      label: 'Campaigns',
      color: 'hsl(var(--accent))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6" />
            <CardTitle>Campaign Overview</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={80} />
              <XAxis type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} layout="vertical" />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>No campaign data to display.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

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
          <CampaignStatusChart />
          <ActiveCampaigns />
        </div>
      </div>
    </div>
  );
}
