
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Cog, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { APP_MODULES } from '@/lib/constants';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


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
      toast({ title: 'Settings Saved', description: 'Your preferences have been updated. Refresh may be required for some changes.' });
    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ variant: 'destructive', title: 'Save Failed', description: error });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!user) return null;

  return (
    <AccordionItem value="page-settings">
       <AccordionTrigger>
        <div className="flex items-center gap-3">
            <Cog className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Page & Module Settings</p>
                <p className="text-sm text-muted-foreground font-normal">Customize the behavior and visibility of application components.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="font-semibold">General Settings</Label>
                        <div className="p-4 border rounded-lg space-y-4">
                            <div className="space-y-1">
                                <Label>Sidebar Behavior</Label>
                                <Select value={settings.sidebar.collapsible} onValueChange={handleSidebarChange}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="icon">Icon Only (collapsible)</SelectItem>
                                        <SelectItem value="offcanvas">Off-canvas (hidden)</SelectItem>
                                        <SelectItem value="none">None (always open)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
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
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="font-semibold">Module Visibility</Label>
                    <Card className="h-full">
                        <CardContent className="p-0">
                            <ScrollArea className="h-72 p-4">
                                <p className="text-sm text-muted-foreground mb-4">Choose which modules are visible in your sidebar. This does not change your role permissions.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                    {APP_MODULES.flatMap(m => m.subModules ? m.subModules : [m])
                                        .filter(m => m.roles.includes(user.role))
                                        .map(module => (
                                        <div key={module.name} className="flex items-center space-x-2">
                                            <Switch
                                                id={`vis-${module.name}`}
                                                checked={visibleModules.includes(module.name)}
                                                onCheckedChange={(checked) => handleModuleToggle(module.name, !!checked)}
                                            />
                                            <label htmlFor={`vis-${module.name}`} className="text-sm font-normal cursor-pointer">{module.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <div className="flex justify-end mt-6">
                <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Page Settings
                </Button>
            </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
