
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Cog, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { APP_MODULES } from '@/lib/constants';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

export type SidebarSettings = {
  collapsible: 'icon' | 'offcanvas' | 'none';
};

export type CveFeedSettings = {
    resultsPerPage: number;
};

export type PageSettings = {
    sidebar: SidebarSettings;
    cveFeed: CveFeedSettings;
};

export const defaultPageSettings: PageSettings = {
    sidebar: { collapsible: 'icon' },
    cveFeed: { resultsPerPage: 10 },
};

export function PageSettingsManager() {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PageSettings>(defaultPageSettings);
  const [visibleModules, setVisibleModules] = useState<string[]>([]);
  
  useEffect(() => {
    if (user?.pageSettings) {
        // Merge with defaults to ensure new settings are not missing
        setSettings(prev => ({
            ...defaultPageSettings,
            ...prev,
            ...user.pageSettings,
            sidebar: { ...defaultPageSettings.sidebar, ...user.pageSettings?.sidebar },
            cveFeed: { ...defaultPageSettings.cveFeed, ...user.pageSettings?.cveFeed },
        }));
    }
     if (user?.enabledModules) {
        setVisibleModules(user.enabledModules);
    }
  }, [user]);

  const handleSidebarChange = (value: SidebarSettings['collapsible']) => {
    setSettings(prev => ({ ...prev, sidebar: { collapsible: value } }));
  };
  
  const handleCveFeedChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0 && num <= 50) {
      setSettings(prev => ({ ...prev, cveFeed: { resultsPerPage: num } }));
    }
  };

  const handleModuleToggle = (moduleName: string, isChecked: boolean) => {
    setVisibleModules(prev => isChecked ? [...prev, moduleName] : prev.filter(m => m !== moduleName));
  };

  const handleSave = () => {
    if (!user) return;
    setIsSaving(true);
    try {
      updateUser(user.username, { pageSettings: settings, enabledModules: visibleModules });
      toast({ title: 'Settings Saved', description: 'Your preferences have been updated.' });
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
          <Cog className="h-6 w-6" />
          <CardTitle>Page & Module Settings</CardTitle>
        </div>
        <CardDescription>Customize the behavior and visibility of application components.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['sidebar', 'modules']}>
            <AccordionItem value="sidebar">
                <AccordionTrigger className="text-base">Sidebar Settings</AccordionTrigger>
                <AccordionContent className="pt-2">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Collapsible Behavior</Label>
                            <Select value={settings.sidebar.collapsible} onValueChange={handleSidebarChange}>
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
            <AccordionItem value="modules">
                 <AccordionTrigger className="text-base">Module Visibility</AccordionTrigger>
                 <AccordionContent className="pt-2">
                    <p className="text-sm text-muted-foreground mb-4">Choose which modules are visible in your sidebar navigation. This does not change your role permissions.</p>
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
            <AccordionItem value="pages" className="border-b-0">
                <AccordionTrigger className="text-base">Page-Specific Settings</AccordionTrigger>
                <AccordionContent className="pt-2">
                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>CVE Feed Results</Label>
                            <Input 
                                type="number" 
                                value={settings.cveFeed.resultsPerPage}
                                onChange={e => handleCveFeedChange(e.target.value)}
                                min="5"
                                max="50"
                            />
                            <p className="text-xs text-muted-foreground">Number of CVEs to show on the Threat Intel page (5-50).</p>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="justify-end border-t pt-6">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
