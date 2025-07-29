
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, History, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { getActivities, clearActivities, type ActivityLog } from '@/services/activity-log-service';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';

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
        <CardDescription>A detailed log of recent actions across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground p-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading recent activity...</span>
          </div>
        ) : feed.length === 0 ? (
            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center p-6">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="font-semibold">No recent activity</p>
                <p className="text-sm">Actions performed will appear here.</p>
            </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feed.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                     <Badge variant={getBadgeVariant(item.user)}>{item.user}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.action}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{item.details}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
