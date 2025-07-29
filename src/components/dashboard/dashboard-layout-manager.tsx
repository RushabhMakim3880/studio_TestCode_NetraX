
'use client';

import { useState } from 'react';
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
import { LayoutGrid } from 'lucide-react';
import { ALL_AVAILABLE_CARDS } from '@/lib/dashboard-cards';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

export function DashboardLayoutManager() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize with the user's layout, or an empty array if none exists.
  const [selectedCards, setSelectedCards] = useState<string[]>(user?.dashboardLayout || []);

  const handleCardToggle = (cardId: string, isChecked: boolean) => {
    setSelectedCards(prev =>
      isChecked
        ? [...prev, cardId] // Add to the end of the array
        : prev.filter(id => id !== cardId) // Remove from the array
    );
  };

  const handleSave = () => {
    if (user) {
      updateUser(user.username, { dashboardLayout: selectedCards });
      toast({ title: 'Dashboard layout updated!' });
      setIsModalOpen(false);
    }
  };
  
  // Separate widgets from shortcuts for display purposes
  const widgets = ALL_AVAILABLE_CARDS.filter(c => !c.id.startsWith('shortcut-'));
  const shortcuts = ALL_AVAILABLE_CARDS.filter(c => c.id.startsWith('shortcut-'));


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
            Select the widgets and shortcuts you want to display on your dashboard. The order of selection will be preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="font-semibold mb-2">Widgets</h3>
                <ScrollArea className="h-96">
                    <div className="space-y-4 pr-4">
                    {widgets.map(card => {
                        const Icon = card.icon;
                        return (
                        <div key={card.id} className="flex items-start gap-4 rounded-lg border p-4">
                            <Switch
                                id={card.id}
                                checked={selectedCards.includes(card.id)}
                                onCheckedChange={checked => handleCardToggle(card.id, !!checked)}
                                className="mt-1"
                            />
                            <div className="grid gap-1">
                            <Label htmlFor={card.id} className="font-semibold flex items-center gap-2 cursor-pointer">
                                <Icon className="h-4 w-4" />
                                {card.title}
                            </Label>
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </ScrollArea>
            </div>
             <div>
                <h3 className="font-semibold mb-2">Shortcut Cards</h3>
                <ScrollArea className="h-96">
                    <div className="space-y-4 pr-4">
                    {shortcuts.map(card => {
                        const Icon = card.icon;
                        return (
                        <div key={card.id} className="flex items-center gap-4 rounded-lg border p-3">
                           <Switch
                                id={card.id}
                                checked={selectedCards.includes(card.id)}
                                onCheckedChange={checked => handleCardToggle(card.id, !!checked)}
                            />
                             <Label htmlFor={card.id} className="font-semibold flex items-center gap-2 text-sm cursor-pointer">
                                <Icon className="h-4 w-4" />
                                {card.title}
                            </Label>
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
