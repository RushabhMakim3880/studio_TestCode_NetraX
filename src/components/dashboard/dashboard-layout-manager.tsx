
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { LayoutGrid, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { ALL_AVAILABLE_CARDS, DashboardCardInfo } from '@/lib/dashboard-cards';

export function DashboardLayoutManager() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCardIds, setVisibleCardIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (user?.dashboardLayout) {
      setVisibleCardIds(user.dashboardLayout);
    }
  }, [user?.dashboardLayout]);

  const handleAddCard = (cardId: string) => {
    if (!visibleCardIds.includes(cardId)) {
      setVisibleCardIds(prev => [...prev, cardId]);
    }
  };
  
  const handleRemoveCard = (cardId: string) => {
      setVisibleCardIds(prev => prev.filter(id => id !== cardId));
  }

  const moveCard = (cardId: string, direction: 'up' | 'down') => {
    const index = visibleCardIds.indexOf(cardId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= visibleCardIds.length) return;
    
    const newOrder = [...visibleCardIds];
    const temp = newOrder[index];
    newOrder[index] = newOrder[newIndex];
    newOrder[newIndex] = temp;
    
    setVisibleCardIds(newOrder);
  };

  const handleSave = () => {
    if (user) {
      updateUser(user.username, { dashboardLayout: visibleCardIds });
      toast({ title: 'Dashboard layout updated!' });
      setIsModalOpen(false);
    }
  };
  
  const visibleCards = visibleCardIds.map(id => ALL_AVAILABLE_CARDS.find(card => card.id === id)).filter(Boolean) as DashboardCardInfo[];
  const availableCards = ALL_AVAILABLE_CARDS.filter(card => !visibleCardIds.includes(card.id));

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LayoutGrid className="mr-2 h-4 w-4" />
          Customize Layout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Customize Dashboard Layout</DialogTitle>
          <DialogDescription>
            Add, remove, and reorder widgets to create your ideal dashboard view.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid md:grid-cols-2 gap-8 h-[60vh]">
            <div>
                <h3 className="font-semibold mb-2">Visible Widgets</h3>
                <ScrollArea className="h-full border rounded-md p-2">
                    <div className="space-y-2">
                        {visibleCards.map((card, index) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.id} className="flex items-center gap-2 p-2 rounded-md bg-primary/10">
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{card.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{card.description}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCard(card.id, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCard(card.id, 'down')} disabled={index === visibleCards.length - 1}><ArrowDown className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveCard(card.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            )
                        })}
                        {visibleCards.length === 0 && <p className="text-sm text-center text-muted-foreground py-10">Add widgets from the right.</p>}
                    </div>
                </ScrollArea>
            </div>
             <div>
                <h3 className="font-semibold mb-2">Available Widgets</h3>
                <ScrollArea className="h-full border rounded-md p-2">
                    <div className="space-y-2">
                    {availableCards.map(card => {
                        const Icon = card.icon;
                        return (
                        <div key={card.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-primary/20">
                           <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                           <div className="flex-grow">
                             <p className="font-semibold text-sm">{card.title}</p>
                             <p className="text-xs text-muted-foreground line-clamp-1">{card.description}</p>
                           </div>
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddCard(card.id)}><Plus className="h-4 w-4"/></Button>
                        </div>
                        );
                    })}
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
