
'use client';

import { useAuth } from '@/hooks/use-auth';
import { AVAILABLE_WIDGET_CARDS, getShortcutCardInfo } from '@/lib/dashboard-cards';
import { DashboardLayoutManager } from '@/components/dashboard/dashboard-layout-manager';
import { LayoutGrid } from 'lucide-react';
import { ShortcutCard } from '@/components/dashboard/shortcut-card';
import { APP_MODULES } from '@/lib/constants';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  const visibleCardIds = user.dashboardLayout || [];
  
  const visibleWidgets = AVAILABLE_WIDGET_CARDS.filter(card => visibleCardIds.includes(card.id));
  const visibleShortcuts = visibleCardIds
    .map(id => getShortcutCardInfo(id, APP_MODULES))
    .filter(Boolean);


  const mainWidgets = visibleWidgets.filter(card => card.id !== 'activity-feed');
  const activityFeedCard = visibleWidgets.find(card => card.id === 'activity-feed');

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Your operational command center.</p>
        </div>
        <DashboardLayoutManager />
      </div>

      {visibleWidgets.length > 0 || visibleShortcuts.length > 0 ? (
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 {mainWidgets.map(card => {
                    const CardComponent = card.component;
                    return (
                        <div key={card.id} className={card.className || ''}>
                            <CardComponent />
                        </div>
                    );
                })}
                {visibleShortcuts.map(shortcut => (
                  <div key={shortcut.id}>
                      <ShortcutCard module={shortcut.module} />
                  </div>
                ))}
            </div>
             <div className="xl:col-span-1">
                {activityFeedCard && <activityFeedCard.component />}
             </div>
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center">
            <LayoutGrid className="h-16 w-16 text-muted-foreground/50 mb-4"/>
            <h3 className="text-xl font-semibold">Your Dashboard is Empty</h3>
            <p className="text-muted-foreground mt-2">Click "Customize Layout" to add some cards.</p>
        </div>
      )}
    </div>
  );
}
