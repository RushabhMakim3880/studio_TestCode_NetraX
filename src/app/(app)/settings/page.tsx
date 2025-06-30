'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { APP_MODULES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [moduleSettings, setModuleSettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedSettings = localStorage.getItem('netra-settings');
    if (storedSettings) {
      setModuleSettings(JSON.parse(storedSettings));
    } else {
      // Default to all enabled
      const defaultSettings: Record<string, boolean> = {};
      APP_MODULES.forEach(module => {
        defaultSettings[module.name] = true;
      });
      setModuleSettings(defaultSettings);
    }
  }, []);

  const handleToggle = (moduleName: string, checked: boolean) => {
    setModuleSettings(prev => ({ ...prev, [moduleName]: checked }));
  };

  const handleSaveChanges = () => {
    localStorage.setItem('netra-settings', JSON.stringify(moduleSettings));
    toast({
      title: 'Settings Saved',
      description: 'Your module preferences have been updated. Refresh may be required.',
    });
  };
  
  const accessibleModules = user ? APP_MODULES.filter(m => m.roles.includes(user.role)) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and modules.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Configuration</CardTitle>
          <CardDescription>Enable or disable modules to customize your sidebar and workflow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleModules.map((module) => (
                // Dont allow disabling Dashboard or Settings
                (module.name !== 'Dashboard' && module.name !== 'Settings') && (
                <div key={module.name} className="flex items-center justify-between rounded-lg border p-4">
                    <Label htmlFor={`module-${module.name}`} className="flex flex-col gap-1">
                    <span className="font-semibold">{module.name}</span>
                    <span className="text-xs text-muted-foreground">Toggle module visibility</span>
                    </Label>
                    <Switch
                    id={`module-${module.name}`}
                    checked={moduleSettings[module.name] ?? false}
                    onCheckedChange={(checked) => handleToggle(module.name, checked)}
                    />
                </div>
            )))}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
