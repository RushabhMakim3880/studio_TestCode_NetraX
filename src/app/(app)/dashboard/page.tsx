
'use client';

import { useAuth } from '@/hooks/use-auth';
import { AVAILABLE_WIDGET_CARDS, getShortcutCardInfo } from '@/lib/dashboard-cards';
import { DashboardLayoutManager } from '@/components/dashboard/dashboard-layout-manager';
import { LayoutGrid } from 'lucide-react';
import { ShortcutCard } from '@/components/dashboard/shortcut-card';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  const visibleCardIds = user.dashboardLayout || [];
  
  const mainWidgets = AVAILABLE_WIDGET_CARDS.filter(card => 
    visibleCardIds.includes(card.id) && !card.id.startsWith('shortcut-') && card.id !== 'activity-feed'
  );
  
  const activityFeedWidget = AVAILABLE_WIDGET_CARDS.find(card => 
    visibleCardIds.includes(card.id) && card.id === 'activity-feed'
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Your operational command center.</p>
        </div>
        <DashboardLayoutManager />
      </div>
      
      {mainWidgets.length > 0 || activityFeedWidget ? (
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Main column for larger widgets */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {mainWidgets.map(card => {
                    const CardComponent = card.component;
                    return (
                        <div key={card.id} className={card.className || ''}>
                           {CardComponent && <CardComponent />}
                        </div>
                    );
                 })}
            </div>

            {/* Right sidebar for activity feed */}
             <div className="xl:col-span-1 flex flex-col gap-6">
                {activityFeedWidget && activityFeedWidget.component && <activityFeedWidget.component />}
             </div>
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
