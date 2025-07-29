
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
  
  // Get the full card info for visible cards
  const visibleCards = ALL_AVAILABLE_CARDS.filter(card => visibleCardIds.includes(card.id));
  
  // Sort the cards based on the user's layout preference to maintain order
  visibleCards.sort((a, b) => visibleCardIds.indexOf(a.id) - visibleCardIds.indexOf(b.id));

  // Separate cards into different types for layouting
  const mainWidgets = visibleCards.filter(card => 
    !card.id.startsWith('shortcut-') && card.id !== 'activity-feed'
  );

  const shortcutWidgets = visibleCards.filter(card =>
    card.id.startsWith('shortcut-')
  );

  const activityFeedWidget = visibleCards.find(card => 
    card.id === 'activity-feed'
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
            {/* Main grid for widgets */}
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
              <>
                <h2 className="font-headline text-2xl font-semibold">Shortcuts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {shortcutWidgets.map(card => (
                       card.module ? <ShortcutCard key={card.id} module={card.module} /> : null
                    ))}
                </div>
              </>
            )}

            {/* Activity Feed at the bottom */}
            {activityFeedWidget && activityFeedWidget.component && (
              <div className="pt-4">
                <div className={activityFeedWidget.className || ''}>
                  <activityFeedWidget.component />
                </div>
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
