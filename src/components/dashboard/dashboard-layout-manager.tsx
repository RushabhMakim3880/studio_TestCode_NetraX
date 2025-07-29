
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { LayoutGrid, PlusCircle, XCircle } from 'lucide-react';
import { ALL_AVAILABLE_CARDS, AVAILABLE_WIDGET_CARDS, AVAILABLE_SHORTCUT_CARDS, DashboardCardInfo } from '@/lib/dashboard-cards';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

export function DashboardLayoutManager() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (user?.dashboardLayout) {
      setVisibleIds(user.dashboardLayout);
    }
  }, [user?.dashboardLayout, isModalOpen]);

  const handleToggleCard = (cardId: string, isVisible: boolean) => {
    setVisibleIds(prev => 
      isVisible ? [...prev, cardId] : prev.filter(id => id !== cardId)
    );
  };

  const handleSave = () => {
    if (user) {
      updateUser(user.username, { dashboardLayout: visibleIds });
      toast({ title: 'Dashboard layout updated!' });
      setIsModalOpen(false);
    }
  };
  
  const WidgetToggle = ({ card }: { card: DashboardCardInfo }) => {
      const Icon = card.icon;
      return (
          <div className="flex items-center justify-between p-3 rounded-md bg-primary/10">
              <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0 text-accent"/>
                  <div>
                      <p className="font-semibold text-sm">{card.title}</p>
                      <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
              </div>
              <Switch
                checked={visibleIds.includes(card.id)}
                onCheckedChange={(checked) => handleToggleCard(card.id, checked)}
              />
          </div>
      )
  };


  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LayoutGrid className="mr-2 h-4 w-4" />
          Customize Layout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Customize Dashboard Layout</DialogTitle>
            <DialogDescription>
                Enable or disable widgets and shortcuts to tailor your dashboard.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-grow grid md:grid-cols-2 gap-6 overflow-hidden py-4">
            <div className="space-y-3 flex flex-col">
                <Label>Widgets</Label>
                <ScrollArea className="flex-grow h-0 pr-4 -mr-4 border rounded-lg">
                    <div className="space-y-2 p-2">
                        {AVAILABLE_WIDGET_CARDS.map((card) => (
                           <WidgetToggle key={card.id} card={card} />
                        ))}
                    </div>
                </ScrollArea>
            </div>
             <div className="space-y-3 flex flex-col">
                <Label>Shortcut Cards</Label>
                <ScrollArea className="flex-grow h-0 pr-4 -mr-4 border rounded-lg">
                    <div className="space-y-2 p-2">
                         {AVAILABLE_SHORTCUT_CARDS.map((card) => (
                           <WidgetToggle key={card.id} card={card} />
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Layout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
