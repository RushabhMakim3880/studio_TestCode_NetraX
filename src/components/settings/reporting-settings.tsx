
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Presentation, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Checkbox } from '../ui/checkbox';

export function ReportingSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings['reporting'] | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const userSettings = await getUserSettings();
      setSettings(userSettings.reporting);
    }
    loadSettings();
  }, [user]);
  
  const handleNestedChange = <K extends keyof UserSettings['reporting']>(
    key: K,
    value: UserSettings['reporting'][K]
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
        reporting: settings,
      };
      
      // Validate before saving
      UserSettingsSchema.parse(newSettings);

      updateUser(user.username, { userSettings: newSettings });
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
    return <Card><CardHeader><CardTitle>Loading Settings...</CardTitle></CardHeader><CardContent><Loader2 className="animate-spin" /></CardContent></Card>;
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
                <Input id="defaultAuthor" value={settings.defaultAuthor} onChange={(e) => handleNestedChange('defaultAuthor', e.target.value)} />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeTimestamp" 
                  checked={settings.includeTimestamp} 
                  onCheckedChange={(checked) => handleNestedChange('includeTimestamp', !!checked)}
                />
                <Label htmlFor="includeTimestamp" className="font-normal">Include generation timestamp in PDF reports</Label>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-semibold">PDF Header/Footer</Label>
              <div className="space-y-2">
                <Label htmlFor="pdfHeader">Default PDF Header Text</Label>
                <Input id="pdfHeader" value={settings.pdfHeader} onChange={(e) => handleNestedChange('pdfHeader', e.target.value)} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="pdfFooter">Default PDF Footer Text</Label>
                <Input id="pdfFooter" value={settings.pdfFooter} onChange={(e) => handleNestedChange('pdfFooter', e.target.value)} />
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
