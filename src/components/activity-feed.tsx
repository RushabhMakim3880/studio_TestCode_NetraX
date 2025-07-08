
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getActivityFeed, type ActivityFeedOutput } from '@/ai/flows/activity-feed-flow';
import { Loader2, AlertTriangle, History } from 'lucide-react';
import { Badge } from './ui/badge';

export function ActivityFeed() {
  const [feed, setFeed] = useState<ActivityFeedOutput['activities'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeed() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getActivityFeed();
        setFeed(response.activities);
      } catch (err) {
        if (err instanceof Error && (err.message.includes('429') || err.message.toLowerCase().includes('quota'))) {
            setError('API quota exceeded. The feed will be unavailable until the quota resets.');
        } else if (err instanceof Error && (err.message.includes('503') || err.message.toLowerCase().includes('overloaded'))) {
            setError('The activity feed service is temporarily busy. It will be back shortly.');
        } else {
            setError('Failed to fetch activity feed.');
            console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeed();
  }, []);

  const getBadgeVariant = (user: string) => {
    if (user.toLowerCase().includes('admin')) return 'destructive';
    if (user.toLowerCase().includes('analyst')) return 'secondary';
    return 'default';
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
            <History className="h-6 w-6" />
            <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>A live feed of recent actions across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading && (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading recent activity...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        {feed && !error && (
          <div className="space-y-6">
            {feed.map((item, index) => (
              <div key={index} className="relative pl-8">
                 <div className="absolute left-0 top-1 h-full">
                    <span className="absolute left-[7px] top-[5px] h-2 w-2 rounded-full bg-accent ring-2 ring-background"></span>
                    {index !== feed.length - 1 && <div className="absolute left-[10px] top-[14px] h-full w-px bg-border"></div>}
                </div>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium">
                            <Badge variant={getBadgeVariant(item.user)} className="mr-2">{item.user}</Badge>
                            {item.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
