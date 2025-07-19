
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, Cog, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '@/hooks/use-auth';
import { APP_MODULES } from '@/lib/constants';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

export type SidebarSettingsConfig = {
  collapsible: 'icon' | 'offcanvas' | 'none';
};

const defaultSidebarSettings: SidebarSettingsConfig = {
    collapsible: 'icon',
};


export function SidebarSettings() {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SidebarSettingsConfig>(defaultSidebarSettings);
  const [visibleModules, setVisibleModules] = useState<string[]>([]);
  
  useEffect(() => {
    if (user?.sidebarSettings) {
        setSettings(user.sidebarSettings);
    }
     if (user?.enabledModules) {
        setVisibleModules(user.enabledModules);
    }
  }, [user]);

  const handleSidebarChange = (value: SidebarSettingsConfig['collapsible']) => {
    setSettings({ collapsible: value });
  };
  
  const handleModuleToggle = (moduleName: string, isChecked: boolean) => {
    setVisibleModules(prev => isChecked ? [...prev, moduleName] : prev.filter(m => m !== moduleName));
  };

  const handleSave = () => {
    if (!user) return;
    setIsSaving(true);
    try {
      updateUser(user.username, { sidebarSettings: settings, enabledModules: visibleModules });
      toast({ title: 'Settings Saved', description: 'Your sidebar preferences have been updated.' });
    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ variant: 'destructive', title: 'Save Failed', description: error });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <PanelLeft className="h-6 w-6" />
          <CardTitle>Sidebar & Navigation</CardTitle>
        </div>
        <CardDescription>Customize the behavior and content of the main navigation sidebar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['behavior', 'visibility']}>
            <AccordionItem value="behavior">
                <AccordionTrigger className="text-base">Sidebar Behavior</AccordionTrigger>
                <AccordionContent className="pt-2">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Collapsible Behavior</Label>
                            <Select value={settings.collapsible} onValueChange={handleSidebarChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="icon">Icon Only</SelectItem>
                                    <SelectItem value="offcanvas">Off-canvas (Hidden)</SelectItem>
                                    <SelectItem value="none">None (Always Open)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="visibility" className="border-b-0">
                 <AccordionTrigger className="text-base">Module Visibility</AccordionTrigger>
                 <AccordionContent className="pt-2">
                    <p className="text-sm text-muted-foreground mb-4">Choose which modules are visible in your sidebar. This does not change your role permissions.</p>
                    <ScrollArea className="h-72">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
                        {APP_MODULES.flatMap(m => m.subModules ? m.subModules : [m])
                            .filter(m => m.roles.includes(user.role))
                            .map(module => (
                            <div key={module.name} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`vis-${module.name}`}
                                    checked={visibleModules.includes(module.name)}
                                    onCheckedChange={(checked) => handleModuleToggle(module.name, !!checked)}
                                />
                                <label htmlFor={`vis-${module.name}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {module.name}
                                </label>
                            </div>
                        ))}
                    </div>
                    </ScrollArea>
                 </AccordionContent>
            </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="justify-end border-t pt-6">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Sidebar Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
