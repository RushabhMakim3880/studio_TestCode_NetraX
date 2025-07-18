
'use client';

import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import { AVAILABLE_DASHBOARD_CARDS } from '@/lib/dashboard-cards';
import { DashboardLayoutManager } from '@/components/dashboard/dashboard-layout-manager';
import { LayoutGrid } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  const visibleCardIds = user.dashboardLayout || [];
  const visibleCards = AVAILABLE_DASHBOARD_CARDS.filter(card => visibleCardIds.includes(card.id));

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Your operational command center.</p>
        </div>
        <DashboardLayoutManager />
      </div>

      {visibleCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {visibleCards.map(card => {
            const CardComponent = card.component;
            return (
              <div key={card.id} className={card.className || 'xl:col-span-1'}>
                <CardComponent />
              </div>
            );
          })}
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
