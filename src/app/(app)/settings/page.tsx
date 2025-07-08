'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { APP_MODULES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Download, Upload } from 'lucide-react';
import { CompanyProfileManager } from '@/components/company-profile-manager';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [moduleSettings, setModuleSettings] = useState<Record<string, boolean>>({});
  const importFileRef = useRef<HTMLInputElement>(null);

  const allModules = APP_MODULES.flatMap(m => m.subModules ? m.subModules : (m.path ? m : []));

  useEffect(() => {
    const storedSettings = localStorage.getItem('netra-settings');
    if (storedSettings) {
      setModuleSettings(JSON.parse(storedSettings));
    } else {
      // Default to all enabled
      const defaultSettings: Record<string, boolean> = {};
      allModules.forEach(module => {
        if(module.path) defaultSettings[module.name] = true;
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
      description: 'Your module preferences have been updated. Refresh may be required to see sidebar changes.',
    });
  };

  const handleExportSettings = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(moduleSettings, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "netra-settings.json";
    link.click();
    toast({ title: "Settings Exported" });
  };
  
  const handleImportClick = () => {
    importFileRef.current?.click();
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedSettings = JSON.parse(event.target?.result as string);
            if (typeof importedSettings === 'object' && importedSettings !== null) {
                const validKeys = allModules.map(m => m.name);
                const importedKeys = Object.keys(importedSettings);
                const areKeysValid = importedKeys.every(key => validKeys.includes(key));
                
                if (areKeysValid) {
                    setModuleSettings(importedSettings);
                    localStorage.setItem('netra-settings', JSON.stringify(importedSettings));
                    toast({ title: 'Settings Imported Successfully', description: 'Your settings have been updated. Refresh may be required to see sidebar changes.' });
                } else {
                     toast({ variant: 'destructive', title: 'Import Error', description: 'Invalid keys found in settings file.' });
                }
            } else {
                throw new Error("Invalid format");
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Import Error', description: 'Could not parse the settings file. Please ensure it is a valid JSON.' });
        }
    };
    reader.readAsText(file);

    if (e.target) e.target.value = '';
  }
  
  if (!user) return null;

  const accessibleModules = APP_MODULES.filter(m => m.roles.some(role => user.role.includes(role)));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and modules.</p>
      </div>

      <CompanyProfileManager />

      <Card>
        <CardHeader>
          <CardTitle>Module Configuration</CardTitle>
          <CardDescription>Enable or disable modules to customize your sidebar and workflow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-6">
            {accessibleModules.map((module) => {
              const subModulesToShow = module.subModules?.filter(sm => sm.roles.includes(user.role)) ?? [];

              if (module.path && module.name !== 'Dashboard' && module.name !== 'Settings') {
                return (
                  <div key={module.name} className="flex items-center justify-between rounded-lg border p-4 max-w-sm">
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
                );
              }

              if (subModulesToShow.length > 0) {
                return (
                  <div key={module.name} className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">{module.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subModulesToShow.map(subModule => (
                              <div key={subModule.name} className="flex items-center justify-between rounded-lg border p-4">
                                  <Label htmlFor={`module-${subModule.name}`} className="flex flex-col gap-1">
                                  <span className="font-semibold">{subModule.name}</span>
                                  <span className="text-xs text-muted-foreground">Toggle module visibility</span>
                                  </Label>
                                  <Switch
                                  id={`module-${subModule.name}`}
                                  checked={moduleSettings[subModule.name] ?? false}
                                  onCheckedChange={(checked) => handleToggle(subModule.name, checked)}
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <div className="flex justify-between items-center pt-4 border-t mt-4">
             <div>
                <Button variant="outline" onClick={handleExportSettings} className="mr-2">
                    <Download className="mr-2 h-4 w-4"/>
                    Export
                </Button>
                <Button variant="outline" onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4"/>
                    Import
                </Button>
                <Input type="file" accept=".json" ref={importFileRef} className="hidden" onChange={handleImportFile} />
             </div>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
