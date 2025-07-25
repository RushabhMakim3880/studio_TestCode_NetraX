
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, Binary } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function OffensiveSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const userSettings = await getUserSettings();
      setSettings(userSettings);
    }
    loadSettings();
  }, [user]);
  
  const handleNestedChange = <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
    category: T,
    key: K,
    value: UserSettings[T][K]
  ) => {
    setSettings(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        };
    });
  };

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      // Validate before saving
      UserSettingsSchema.parse(settings);

      updateUser(user.username, { userSettings: settings });
      toast({ title: 'Offensive Settings Saved' });
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
    <AccordionItem value="offensive-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <KeyRound className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Offensive Tool Settings</p>
                <p className="text-sm text-muted-foreground font-normal">Set default values for payload generators.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Column 1: Payloads */}
            <div className="space-y-4">
              <Label className="font-semibold">Payload Defaults</Label>
              <div className="space-y-2">
                <Label htmlFor="defaultLhost">Default LHOST</Label>
                <Input id="defaultLhost" value={settings.offensive.defaultLhost} onChange={(e) => handleNestedChange('offensive', 'defaultLhost', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLport">Default LPORT</Label>
                <Input id="defaultLport" value={settings.offensive.defaultLport} onChange={(e) => handleNestedChange('offensive', 'defaultLport', e.target.value)} />
              </div>
            </div>

            {/* Column 2: Merging Station */}
            <div className="space-y-4">
               <Label className="font-semibold">Merging Station Defaults</Label>
               <div className="space-y-2">
                 {['enableSandboxDetection', 'selfDestruct', 'fileless', 'useFragmentation'].map((id) => (
                    <div className="flex items-center space-x-2" key={id}>
                        <Checkbox 
                            id={`ms-${id}`}
                            checked={settings.mergingStation.defaultEvasion.includes(id)}
                            onCheckedChange={(checked) => {
                                const current = settings.mergingStation.defaultEvasion;
                                const newDefaults = checked ? [...current, id] : current.filter(i => i !== id);
                                handleNestedChange('mergingStation', 'defaultEvasion', newDefaults);
                            }}
                        />
                        <Label htmlFor={`ms-${id}`} className="font-normal capitalize">{id.replace(/([A-Z])/g, ' $1').replace('Enable ', '')}</Label>
                    </div>
                 ))}
               </div>
            </div>
            
            {/* Column 3: LOLBins */}
            <div className="space-y-4">
                <Label className="font-semibold">LOLBins Defaults</Label>
                <div className="space-y-2">
                    <Label htmlFor="lolbinDefault">Default Binary</Label>
                    <Select value={settings.lolbins.default} onValueChange={(value) => handleNestedChange('lolbins', 'default', value)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="certutil">certutil.exe</SelectItem>
                            <SelectItem value="mshta">mshta.exe</SelectItem>
                            <SelectItem value="regsvr32">regsvr32.exe</SelectItem>
                            <SelectItem value="bitsadmin">bitsadmin.exe</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Offensive Settings
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
