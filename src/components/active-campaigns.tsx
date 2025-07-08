'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Route, ArrowRight, FolderSearch, Briefcase } from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  target: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
};

type Task = {
  id: string;
  campaignId: string;
  status: 'To Do' | 'In Progress' | 'Completed';
};

export function ActiveCampaigns() {
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem('netra-campaigns');
      const allCampaigns = storedCampaigns ? JSON.parse(storedCampaigns) : [];
      setActiveCampaigns(allCampaigns.filter((c: Campaign) => c.status === 'Active'));

      const storedTasks = localStorage.getItem('netra-tasks');
      setTasks(storedTasks ? JSON.parse(storedTasks) : []);
    } catch (error) {
      console.error('Failed to load campaign data from localStorage', error);
    }
  }, []);

  const getCampaignProgress = (campaignId: string) => {
    const campaignTasks = tasks.filter(t => t.campaignId === campaignId);
    if (campaignTasks.length === 0) return 0;
    const completedTasks = campaignTasks.filter(t => t.status === 'Completed').length;
    return (completedTasks / campaignTasks.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <Briefcase className="h-6 w-6" />
                <CardTitle>Active Projects</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/project-management">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
        <CardDescription>An overview of ongoing operations.</CardDescription>
      </CardHeader>
      <CardContent>
        {activeCampaigns.length > 0 ? (
          <div className="space-y-6">
            {activeCampaigns.map(campaign => {
              const progress = getCampaignProgress(campaign.id);
              return (
                <div key={campaign.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">Target: {campaign.target}</p>
                  </div>
                   <Progress value={progress} className="h-2" />
                   <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(progress)}% Complete</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <FolderSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
            <p>No active projects.</p>
            <Button variant="link" asChild><Link href="/project-management">Start a new project</Link></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
