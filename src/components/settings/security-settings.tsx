
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

export function SecuritySettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings['security'] | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const userSettings = await getUserSettings();
      setSettings(userSettings.security);
    }
    loadSettings();
  }, [user]);
  
  const handleNestedChange = <K extends keyof UserSettings['security']>(
    key: K,
    value: UserSettings['security'][K]
  ) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };
  
  const handlePasswordPolicyToggle = (policyId: keyof UserSettings['security']['passwordPolicy'], isChecked: boolean) => {
      if(!settings) return;
      const currentPolicies = settings.passwordPolicy.requiredChars;
      const newPolicies = isChecked ? [...currentPolicies, policyId] : currentPolicies.filter(p => p !== policyId);
      setSettings({
          ...settings,
          passwordPolicy: {
              ...settings.passwordPolicy,
              requiredChars: newPolicies as any[]
          }
      });
  }

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      const userSettings = await getUserSettings();
      const newSettings: UserSettings = {
        ...userSettings,
        security: settings,
      };
      
      UserSettingsSchema.parse(newSettings);
      updateUser(user.username, { userSettings: newSettings });
      toast({ title: 'Security Settings Saved' });
    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ variant: 'destructive', title: 'Save Failed', description: error });
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== 'Admin') return null;
  if (!settings) {
    return null;
  }

  return (
    <AccordionItem value="security-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Security & Access Control</p>
                <p className="text-sm text-muted-foreground font-normal">Harden application security with 2FA, password policies, and IP whitelisting.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="font-semibold">Password Policy</Label>
              <div className="space-y-2">
                <Label htmlFor="minLength">Minimum Length</Label>
                <Input id="minLength" type="number" value={settings.passwordPolicy.minLength} onChange={(e) => setSettings({...settings, passwordPolicy: {...settings.passwordPolicy, minLength: Number(e.target.value)} })} />
              </div>
              <div className="space-y-2">
                  <p className="text-sm font-medium">Require characters:</p>
                   <div className="flex items-center space-x-2">
                        <Switch id="req-upper" checked={settings.passwordPolicy.requiredChars.includes('uppercase')} onCheckedChange={(c) => handlePasswordPolicyToggle('uppercase', !!c)} />
                        <Label htmlFor="req-upper" className="font-normal">Uppercase (A-Z)</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                        <Switch id="req-lower" checked={settings.passwordPolicy.requiredChars.includes('lowercase')} onCheckedChange={(c) => handlePasswordPolicyToggle('lowercase', !!c)} />
                        <Label htmlFor="req-lower" className="font-normal">Lowercase (a-z)</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                        <Switch id="req-number" checked={settings.passwordPolicy.requiredChars.includes('number')} onCheckedChange={(c) => handlePasswordPolicyToggle('number', !!c)} />
                        <Label htmlFor="req-number" className="font-normal">Number (0-9)</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                        <Switch id="req-special" checked={settings.passwordPolicy.requiredChars.includes('special')} onCheckedChange={(c) => handlePasswordPolicyToggle('special', !!c)} />
                        <Label htmlFor="req-special" className="font-normal">Special Character (!@#$...)</Label>
                   </div>
              </div>
            </div>

            <div className="space-y-4">
               <Label className="font-semibold">Access Control</Label>
               <div className="flex items-center space-x-2">
                  <Switch id="force2fa" checked={settings.force2FA} onCheckedChange={(c) => handleNestedChange('force2FA', !!c)} />
                  <Label htmlFor="force2fa" className="font-normal">Force Two-Factor Authentication for all users</Label>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                 <Textarea 
                    id="ipWhitelist" 
                    value={settings.ipWhitelist.join('\n')}
                    onChange={(e) => handleNestedChange('ipWhitelist', e.target.value.split('\n'))}
                    placeholder="192.168.1.1&#10;10.0.0.0/8"
                    className="font-mono h-28"
                />
                 <p className="text-xs text-muted-foreground">One IP address or CIDR range per line. Leave empty to allow all IPs.</p>
               </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Security Settings
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
