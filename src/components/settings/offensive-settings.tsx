
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';

const offensiveTools = [
    { id: 'showReverseShell', label: 'Reverse Shell Generator' },
    { id: 'showLolbins', label: 'LOLBins Payload Generator' },
    { id: 'showSessionHijacking', label: 'Session Hijacking Tool' },
    { id: 'showClickjacking', label: 'Clickjacking Tool' },
    { id: 'showJwtAnalyzer', label: 'JWT Analyzer' },
    { id: 'showPasswordCracker', label: 'Password Cracker' },
    { id: 'showCustomMalware', label: 'AI Malware Concept Generator' },
    { id: 'showExploitSuggester', label: 'Exploit Suggester' },
    { id: 'showYaraGenerator', label: 'AI Yara Rule Generator' },
    { id: 'showHashCalculator', label: 'Hash Calculator' },
    { id: 'showEncoderDecoder', label: 'Encoder/Decoder' },
    { id: 'showRubberDucky', label: 'AI DuckyScript Generator' },
];

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

  const handleToolVisibilityChange = (toolId: string, checked: boolean) => {
    handleNestedChange('offensive', toolId as keyof UserSettings['offensive'], checked);
  }

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
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
    return <AccordionItem value="offensive-settings-loading" disabled><AccordionTrigger>Loading Settings...</AccordionTrigger></AccordionItem>;
  }

  return (
    <AccordionItem value="offensive-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <KeyRound className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Offensive Tool Settings</p>
                <p className="text-sm text-muted-foreground font-normal">Set defaults and manage visibility for offensive tools.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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

            <div className="space-y-4">
              <Label className="font-semibold">Tool Visibility</Label>
              <ScrollArea className="h-48 border rounded-md p-4">
                <div className="space-y-2">
                {offensiveTools.map(tool => (
                  <div key={tool.id} className="flex items-center justify-between">
                    <Label htmlFor={tool.id} className="font-normal">{tool.label}</Label>
                    <Switch
                      id={tool.id}
                      checked={!!settings.offensive[tool.id as keyof typeof settings.offensive]}
                      onCheckedChange={(checked) => handleToolVisibilityChange(tool.id, checked)}
                    />
                  </div>
                ))}
                </div>
              </ScrollArea>
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
