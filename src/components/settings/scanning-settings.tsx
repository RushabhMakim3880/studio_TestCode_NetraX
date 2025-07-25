
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScanSearch, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export function ScanningSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings['scanning'] | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const userSettings = await getUserSettings();
      setSettings(userSettings.scanning);
    }
    loadSettings();
  }, [user]);

  const handleNestedChange = <K extends keyof UserSettings['scanning']>(
    key: K,
    value: UserSettings['scanning'][K]
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
        scanning: settings,
      };
      
      // Validate before saving
      UserSettingsSchema.parse(newSettings);

      updateUser(user.username, { userSettings: newSettings });
      toast({ title: 'Scanning Settings Saved' });
    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ variant: 'destructive', title: 'Save Failed', description: error });
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return <Card><CardHeader><CardTitle>Loading Settings...</CardTitle></CardHeader><CardContent><Loader2 className="animate-spin" /></CardContent></Card>;
  }

  return (
    <AccordionItem value="scanning-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <ScanSearch className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Intelligence & Scanning Settings</p>
                <p className="text-sm text-muted-foreground font-normal">Configure default scan parameters and network options.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="font-semibold">Default Scan Parameters</Label>
               <div className="space-y-2">
                <Label htmlFor="defaultPortScan">Default Port List</Label>
                <Input id="defaultPortScan" value={settings.defaultPortScan} onChange={(e) => handleNestedChange('defaultPortScan', e.target.value)} />
                 <p className="text-xs text-muted-foreground">For the Advanced Network Scanner.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultIdorRange">Default IDOR Range</Label>
                <Input id="defaultIdorRange" value={settings.defaultIdorRange} onChange={(e) => handleNestedChange('defaultIdorRange', e.target.value)} />
                 <p className="text-xs text-muted-foreground">For the IDOR Scanner (e.g., "1-100").</p>
              </div>
            </div>

            <div className="space-y-4">
               <Label className="font-semibold">Global Network Settings</Label>
               <div className="space-y-2">
                 <Label htmlFor="globalTimeout">API Timeout (ms)</Label>
                 <Input id="globalTimeout" type="number" value={settings.globalTimeout} onChange={(e) => handleNestedChange('globalTimeout', Number(e.target.value))} />
                 <p className="text-xs text-muted-foreground">Timeout for external API calls (e.g., WHOIS, VirusTotal).</p>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="userAgent">Custom User-Agent</Label>
                 <Input id="userAgent" value={settings.userAgent} onChange={(e) => handleNestedChange('userAgent', e.target.value)} />
                 <p className="text-xs text-muted-foreground">Used for server-side `fetch` requests to external sites.</p>
               </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Scanning Settings
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
