
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Presentation, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Switch } from '../ui/switch';

export function ReportingSettings() {
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
  
   const handleVisibilityChange = (toolId: string, checked: boolean) => {
    handleNestedChange('reporting', toolId as keyof UserSettings['reporting'], checked);
  }

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      UserSettingsSchema.parse(settings);
      updateUser(user.username, { userSettings: settings });
      toast({ title: 'Reporting Settings Saved' });
    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ variant: 'destructive', title: 'Save Failed', description: error });
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return <AccordionItem value="reporting-settings-loading" disabled><AccordionTrigger>Loading Settings...</AccordionTrigger></AccordionItem>;
  }

  return (
    <AccordionItem value="reporting-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <Presentation className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Reporting & Documentation Settings</p>
                <p className="text-sm text-muted-foreground font-normal">Customize generated reports and documents.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="font-semibold">Author & Timestamps</Label>
               <div className="space-y-2">
                <Label htmlFor="defaultAuthor">Default Report Author</Label>
                <Input id="defaultAuthor" value={settings.reporting.defaultAuthor} onChange={(e) => handleNestedChange('reporting', 'defaultAuthor', e.target.value)} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="includeTimestamp" 
                  checked={settings.reporting.includeTimestamp} 
                  onCheckedChange={(checked) => handleNestedChange('reporting', 'includeTimestamp', !!checked)}
                />
                <Label htmlFor="includeTimestamp" className="font-normal">Include generation timestamp in PDF reports</Label>
              </div>
            </div>
             <div className="space-y-4">
              <Label className="font-semibold">Tool Visibility</Label>
              <div className="space-y-2 border rounded-md p-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="showReportFormatter" className="font-normal">Report Formatter (Bug Bounty)</Label>
                    <Switch id="showReportFormatter" checked={settings.reporting.showReportFormatter} onCheckedChange={(c) => handleVisibilityChange('showReportFormatter', c)} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Reporting Settings
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
