
'use client';

import { useAuth } from '@/hooks/use-auth';
import { ALL_AVAILABLE_CARDS } from '@/lib/dashboard-cards';
import { DashboardLayoutManager } from '@/components/dashboard/dashboard-layout-manager';
import { LayoutGrid } from 'lucide-react';
import { ShortcutCard } from '@/components/dashboard/shortcut-card';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  const visibleCardIds = user.dashboardLayout || [];
  
  const chartIds = ['project-progress', 'task-status', 'user-roles', 'user-performance', 'threat-intel'];

  // Filter for standard widgets, excluding charts, shortcuts, and the activity feed.
  const mainWidgets = ALL_AVAILABLE_CARDS.filter(card => 
    visibleCardIds.includes(card.id) &&
    !card.id.startsWith('shortcut-') &&
    card.id !== 'activity-feed' &&
    !chartIds.includes(card.id)
  );

  // Filter specifically for shortcut cards.
  const shortcutWidgets = ALL_AVAILABLE_CARDS.filter(card =>
    visibleCardIds.includes(card.id) &&
    card.id.startsWith('shortcut-')
  );

  // Isolate the activity feed widget to place it at the bottom.
  const activityFeedWidget = ALL_AVAILABLE_CARDS.find(card => 
    visibleCardIds.includes(card.id) && card.id === 'activity-feed'
  );

  const hasContent = mainWidgets.length > 0 || shortcutWidgets.length > 0 || activityFeedWidget;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Your operational command center.</p>
        </div>
        <DashboardLayoutManager />
      </div>
      
      {hasContent ? (
         <div className="space-y-6">
            {/* Main grid for standard widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {mainWidgets.map(card => {
                    const CardComponent = card.component;
                    return (
                        <div key={card.id} className={card.className || ''}>
                           {CardComponent && <CardComponent />}
                        </div>
                    );
                 })}
            </div>

            {/* Grid for shortcut cards */}
            {shortcutWidgets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {shortcutWidgets.map(card => (
                       card.module ? <ShortcutCard key={card.id} module={card.module} /> : null
                    ))}
                </div>
            )}

            {/* Activity Feed at the bottom */}
            {activityFeedWidget && activityFeedWidget.component && (
              <div className="pt-4">
                <activityFeedWidget.component />
              </div>
            )}
         </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-4 bg-card">
            <LayoutGrid className="h-16 w-16 text-muted-foreground/50 mb-4"/>
            <h3 className="text-xl font-semibold">Your Dashboard is Empty</h3>
            <p className="text-muted-foreground mt-2">Click "Customize Layout" to add some cards.</p>
        </div>
      )}
    </div>
  );
}
