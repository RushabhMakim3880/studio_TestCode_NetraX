
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, History, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { getActivities, clearActivities, type ActivityLog } from '@/services/activity-log-service';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';

export function ActivityFeed() {
  const [feed, setFeed] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchFeed = useCallback(() => {
    setIsLoading(true);
    // Simulate a short delay to feel like a fetch
    setTimeout(() => {
      const activities = getActivities();
      setFeed(activities);
      setIsLoading(false);
    }, 200);
  }, []);

  useEffect(() => {
    fetchFeed();
    
    // Listen for the custom event to refresh the feed
    window.addEventListener('activityLogUpdated', fetchFeed);

    return () => {
        window.removeEventListener('activityLogUpdated', fetchFeed);
    };
  }, [fetchFeed]);

  const handleClearLog = () => {
    clearActivities();
  };

  const getBadgeVariant = (userRole: string) => {
    if (userRole.toLowerCase().includes('admin')) return 'destructive';
    if (userRole.toLowerCase().includes('analyst')) return 'secondary';
    return 'default';
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <History className="h-6 w-6" />
                <CardTitle>Recent Activity</CardTitle>
            </div>
             {user?.role === 'Admin' && feed.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearLog}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Log
                </Button>
            )}
        </div>
        <CardDescription>A live feed of recent actions across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading recent activity...</span>
          </div>
        )}
        {!isLoading && feed.length === 0 && (
            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center p-4">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="font-semibold">No recent activity</p>
                <p className="text-sm">Actions performed will appear here.</p>
            </div>
        )}
        {!isLoading && feed.length > 0 && (
          <div className="space-y-6">
            {feed.map((item, index) => (
              <div key={item.id} className="relative pl-8">
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
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
