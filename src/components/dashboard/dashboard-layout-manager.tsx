
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
import { LayoutGrid, ArrowUp, ArrowDown, PlusCircle, XCircle } from 'lucide-react';
import { ALL_AVAILABLE_CARDS, DashboardCardInfo } from '@/lib/dashboard-cards';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

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

  const handleAddCard = (cardId: string) => {
    if (!visibleIds.includes(cardId)) {
      setVisibleIds(prev => [...prev, cardId]);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setVisibleIds(prev => prev.filter(id => id !== cardId));
  };
  
  const moveCard = (cardId: string, direction: 'up' | 'down') => {
      const index = visibleIds.indexOf(cardId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= visibleIds.length) return;

      const newVisibleIds = [...visibleIds];
      const temp = newVisibleIds[index];
      newVisibleIds[index] = newVisibleIds[newIndex];
      newVisibleIds[newIndex] = temp;
      setVisibleIds(newVisibleIds);
  }

  const handleSave = () => {
    if (user) {
      updateUser(user.username, { dashboardLayout: visibleIds });
      toast({ title: 'Dashboard layout updated!' });
      setIsModalOpen(false);
    }
  };
  
  const visibleCards = ALL_AVAILABLE_CARDS.filter(c => visibleIds.includes(c.id))
      .sort((a, b) => visibleIds.indexOf(a.id) - visibleIds.indexOf(b.id));
      
  const availableCards = ALL_AVAILABLE_CARDS.filter(c => !visibleIds.includes(c.id));
  
  const WidgetCard = ({ card, action, icon }: { card: DashboardCardInfo, action: () => void, icon: React.ReactNode }) => {
      const Icon = card.icon;
      return (
          <div className="flex items-center justify-between p-3 rounded-md bg-primary/10">
              <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0 text-accent"/>
                  <div>
                      <p className="font-semibold text-sm">{card.title}</p>
                  </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={action}>{icon}</Button>
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
                Add, remove, and reorder widgets to create your perfect dashboard.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-grow grid md:grid-cols-2 gap-6 overflow-hidden py-4">
            <div className="space-y-3 flex flex-col">
                <Label>Visible Widgets ({visibleCards.length})</Label>
                <ScrollArea className="flex-grow h-0 pr-4 -mr-4 border rounded-lg">
                    <div className="space-y-2 p-2">
                        {visibleCards.map((card, index) => (
                             <div key={card.id} className="flex items-center justify-between p-3 rounded-md bg-primary/20">
                                <div className="flex items-center gap-3">
                                    <card.icon className="h-5 w-5 shrink-0 text-accent"/>
                                    <p className="font-semibold text-sm">{card.title}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCard(card.id, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCard(card.id, 'down')} disabled={index === visibleCards.length - 1}><ArrowDown className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveCard(card.id)}><XCircle className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                         {visibleCards.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">Add widgets from the available list.</p>}
                    </div>
                </ScrollArea>
            </div>
             <div className="space-y-3 flex flex-col">
                <Label>Available Widgets ({availableCards.length})</Label>
                <ScrollArea className="flex-grow h-0 pr-4 -mr-4 border rounded-lg">
                    <div className="space-y-2 p-2">
                        {availableCards.map((card) => (
                            <WidgetCard key={card.id} card={card} action={() => handleAddCard(card.id)} icon={<PlusCircle className="h-4 w-4 text-green-400"/>} />
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
