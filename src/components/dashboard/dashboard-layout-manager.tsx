
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
import { LayoutGrid, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ALL_AVAILABLE_CARDS, DashboardCardInfo, AVAILABLE_WIDGET_CARDS, AVAILABLE_SHORTCUT_CARDS } from '@/lib/dashboard-cards';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';


export function DashboardLayoutManager() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (user?.dashboardLayout) {
      setSelectedCardIds(user.dashboardLayout);
    }
  }, [user?.dashboardLayout, isModalOpen]);

  const handleCardToggle = (cardId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCardIds(prev => [...prev, cardId]);
    } else {
      setSelectedCardIds(prev => prev.filter(id => id !== cardId));
    }
  };

  const handleSave = () => {
    if (user) {
      updateUser(user.username, { dashboardLayout: selectedCardIds });
      toast({ title: 'Dashboard layout updated!' });
      setIsModalOpen(false);
    }
  };
  
  const WidgetCardToggle = ({ card, isSelected }: { card: DashboardCardInfo, isSelected: boolean }) => {
      const Icon = card.icon;
      return (
           <div className={cn("flex items-center justify-between p-3 rounded-md transition-colors", isSelected ? "bg-primary/20" : "")}>
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-accent"/>
                    <div>
                    <p className="font-semibold">{card.title}</p>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                    </div>
                </div>
                <Switch 
                checked={isSelected} 
                onCheckedChange={(checked) => handleCardToggle(card.id, checked)}
                />
            </div>
      )
  };

  const ShortcutCardToggle = ({ card, isSelected }: { card: DashboardCardInfo, isSelected: boolean }) => {
      const Icon = card.icon;
      return (
           <div className={cn("flex items-center justify-between p-3 rounded-md transition-colors", isSelected ? "bg-primary/20" : "")}>
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm font-medium">{card.title}</span>
                </div>
                <Switch 
                    checked={isSelected} 
                    onCheckedChange={(checked) => handleCardToggle(card.id, checked)}
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
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Customize Dashboard Layout</DialogTitle>
              <DialogDescription>
                Select the widgets and shortcuts you want to display on your dashboard.
              </DialogDescription>
            </div>
             <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Layout</Button>
            </div>
          </div>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 flex-grow overflow-hidden py-4">
            <div className="space-y-3 flex flex-col">
                <h3 className="font-semibold px-1">Widgets</h3>
                <ScrollArea className="h-full pr-4 -mr-4 border rounded-lg">
                    <div className="space-y-3 p-1">
                        {AVAILABLE_WIDGET_CARDS.map((card) => (
                           <WidgetCardToggle key={card.id} card={card} isSelected={selectedCardIds.includes(card.id)} />
                        ))}
                    </div>
                </ScrollArea>
            </div>
             <div className="space-y-3 flex flex-col">
                <h3 className="font-semibold px-1">Shortcut Cards</h3>
                <ScrollArea className="h-full pr-4 -mr-4 border rounded-lg">
                    <div className="space-y-2 p-1">
                        {AVAILABLE_SHORTCUT_CARDS.map((card) => (
                            <ShortcutCardToggle key={card.id} card={card} isSelected={selectedCardIds.includes(card.id)} />
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
