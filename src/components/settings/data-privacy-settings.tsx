
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Database, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { saveAs } from 'file-saver';

export function DataPrivacySettings() {
  const { user, updateUser, users, exportAllData, importAllData } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings['dataPrivacy'] | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const userSettings = await getUserSettings();
      setSettings(userSettings.dataPrivacy);
    }
    loadSettings();
  }, [user]);
  
  const handleNestedChange = <K extends keyof UserSettings['dataPrivacy']>(
    key: K,
    value: UserSettings['dataPrivacy'][K]
  ) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      const userSettings = await getUserSettings();
      const newSettings: UserSettings = {
        ...userSettings,
        dataPrivacy: settings,
      };
      
      UserSettingsSchema.parse(newSettings);
      updateUser(user.username, { userSettings: newSettings });
      toast({ title: 'Data & Privacy Settings Saved' });
    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ variant: 'destructive', title: 'Save Failed', description: error });
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `netra-x-backup-${new Date().toISOString().split('T')[0]}.json`);
    toast({ title: 'Data Exported', description: 'All application data has been downloaded.'});
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          importAllData(data);
          toast({ title: 'Import Successful', description: 'All data has been restored from the backup file.'});
          // Force reload to reflect changes everywhere
          window.location.reload();
        } catch (error) {
          toast({ variant: 'destructive', title: 'Import Failed', description: 'The selected file is not a valid backup.'});
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  };

  if (user?.role !== 'Admin') return null;
  if (!settings) {
    return null;
  }

  return (
    <AccordionItem value="data-privacy-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <Database className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Data & Privacy</p>
                <p className="text-sm text-muted-foreground font-normal">Configure data retention and backup policies.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="font-semibold">Data Retention Policies</Label>
               <div className="space-y-2">
                <Label htmlFor="credentialLogRetention">Captured Credential Log</Label>
                <Select value={settings.credentialLogRetention} onValueChange={(v) => handleNestedChange('credentialLogRetention', v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Delete after 7 days</SelectItem>
                    <SelectItem value="30">Delete after 30 days</SelectItem>
                    <SelectItem value="90">Delete after 90 days</SelectItem>
                    <SelectItem value="never">Never Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityLogRetention">Activity Log</Label>
                 <Select value={settings.activityLogRetention} onValueChange={(v) => handleNestedChange('activityLogRetention', v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Delete after 30 days</SelectItem>
                    <SelectItem value="90">Delete after 90 days</SelectItem>
                    <SelectItem value="365">Delete after 1 year</SelectItem>
                    <SelectItem value="never">Never Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
               <Label className="font-semibold">Backup & Restore</Label>
               <div className="space-y-2">
                 <Button onClick={handleExport} className="w-full" variant="outline">Export All Application Data</Button>
                 <p className="text-xs text-muted-foreground">Exports users, settings, projects, templates, etc. to a JSON file.</p>
               </div>
               <div className="space-y-2">
                  <Input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport}/>
                  <Button onClick={() => document.getElementById('import-file')?.click()} className="w-full" variant="destructive">Import and Overwrite Data</Button>
                  <p className="text-xs text-muted-foreground">Importing will overwrite ALL existing application data. Use with caution.</p>
               </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Data Settings
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
