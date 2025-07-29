
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
import { LayoutGrid, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { ALL_AVAILABLE_CARDS, DashboardCardInfo, AVAILABLE_WIDGET_CARDS, AVAILABLE_SHORTCUT_CARDS } from '@/lib/dashboard-cards';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';


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
          <Card className={cn("p-4 transition-all", isSelected ? "border-accent/50 bg-accent/10" : "border-border")}>
              <div className="flex items-start justify-between">
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
          </Card>
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Customize Dashboard Layout</DialogTitle>
          <DialogDescription>
            Select the widgets and shortcuts you want to display on your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 h-[60vh] py-4">
            <div className="space-y-3">
                <h3 className="font-semibold">Widgets</h3>
                <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="space-y-3">
                        {AVAILABLE_WIDGET_CARDS.map((card) => (
                           <WidgetCardToggle key={card.id} card={card} isSelected={selectedCardIds.includes(card.id)} />
                        ))}
                    </div>
                </ScrollArea>
            </div>
             <div className="space-y-3">
                <h3 className="font-semibold">Shortcut Cards</h3>
                <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="space-y-2">
                        {AVAILABLE_SHORTCUT_CARDS.map((card) => (
                            <ShortcutCardToggle key={card.id} card={card} isSelected={selectedCardIds.includes(card.id)} />
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
