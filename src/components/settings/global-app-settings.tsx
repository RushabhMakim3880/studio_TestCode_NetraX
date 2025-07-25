
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export function GlobalAppSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings['global'] | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const userSettings = await getUserSettings();
      setSettings(userSettings.global);
    }
    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      const userSettings = await getUserSettings();
      const newSettings: UserSettings = {
        ...userSettings,
        global: settings,
      };
      
      // Validate before saving
      UserSettingsSchema.parse(newSettings);

      updateUser(user.username, { userSettings: newSettings });
      toast({ title: 'Global Settings Saved' });
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
    <AccordionItem value="global-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Global Application Settings</p>
                <p className="text-sm text-muted-foreground font-normal">Configure high-level application behavior.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="font-semibold">Activity Logging</Label>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="disable-logging" 
                  checked={settings.disableLogging}
                  onCheckedChange={(checked) => setSettings(s => s ? {...s, disableLogging: checked} : null)}
                />
                <Label htmlFor="disable-logging">Globally Disable Activity Logging</Label>
              </div>
              {!settings.disableLogging && (
                <RadioGroup 
                  value={settings.logVerbosity} 
                  onValueChange={(value: 'standard' | 'detailed') => setSettings(s => s ? {...s, logVerbosity: value} : null)}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="v-standard" />
                    <Label htmlFor="v-standard" className="font-normal">Standard (Log major actions)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="detailed" id="v-detailed" />
                    <Label htmlFor="v-detailed" className="font-normal">Detailed (Log all significant events)</Label>
                  </div>
                </RadioGroup>
              )}
            </div>
            <div className="space-y-4">
               <Label className="font-semibold">Security</Label>
               <div className="space-y-1">
                 <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                 <Input 
                    id="session-timeout" 
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings(s => s ? {...s, sessionTimeout: Number(e.target.value)} : null)}
                 />
                 <p className="text-xs text-muted-foreground">Automatically log out after a period of inactivity.</p>
               </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Global Settings
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
