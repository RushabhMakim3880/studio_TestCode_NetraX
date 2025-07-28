
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScanSearch, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';

const scanningTools = [
    { id: 'showDarkWebScanner', label: 'Dark Web Scanner' },
    { id: 'showWhois', label: 'Whois Lookup' },
    { id: 'showDns', label: 'DNS Lookup' },
    { id: 'showBreachCheck', label: 'Breach Data Checker' },
    { id: 'showSocialMedia', label: 'Social Media Analyzer' },
    { id: 'showIocExtractor', label: 'IoC Extractor' },
    { id: 'showDataObfuscator', label: 'Data Obfuscator' },
    { id: 'showMetadataScrubber', label: 'Metadata Scrubber' },
    { id: 'showEmailHeaderAnalyzer', label: 'Email Header Analyzer' },
    { id: 'showGoogleDorker', label: 'Google Dorker' },
    { id: 'showShodanDorker', label: 'Shodan Dorker' },
    { id: 'showSubdomainScanner', label: 'Subdomain Scanner' },
    { id: 'showRealPortScanner', label: 'Advanced Port Scanner' },
    { id: 'showInjectionScanner', label: 'Injection Scanner' },
    { id: 'showHeaderAnalyzer', label: 'Header Analyzer' },
    { id: 'showExploitChainAssistant', label: 'Exploit Chain Assistant' },
    { id: 'showConfigAnalyzer', label: 'Config Analyzer' },
    { id: 'showCvssCalculator', label: 'CVSS Calculator' },
    { id: 'showIdorScanner', label: 'IDOR Scanner' },
    { id: 'showFirmwareAnalyzer', label: 'Firmware Analyzer' },
    { id: 'showIotTrafficAnalyzer', label: 'IoT Traffic Analyzer' },
];

export function ScanningSettings() {
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
    handleNestedChange('scanning', toolId as keyof UserSettings['scanning'], checked);
  }

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      UserSettingsSchema.parse(settings);
      updateUser(user.username, { userSettings: settings });
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
    return <AccordionItem value="scanning-settings-loading" disabled><AccordionTrigger>Loading Settings...</AccordionTrigger></AccordionItem>;
  }

  return (
    <AccordionItem value="scanning-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <ScanSearch className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Intelligence & Scanning Settings</p>
                <p className="text-sm text-muted-foreground font-normal">Configure scan parameters and tool visibility.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Label className="font-semibold">Default Scan Parameters</Label>
               <div className="space-y-2">
                <Label htmlFor="defaultPortScan">Default Port List</Label>
                <Input id="defaultPortScan" value={settings.scanning.defaultPortScan} onChange={(e) => handleNestedChange('scanning','defaultPortScan', e.target.value)} />
                 <p className="text-xs text-muted-foreground">For the Advanced Network Scanner.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultIdorRange">Default IDOR Range</Label>
                <Input id="defaultIdorRange" value={settings.scanning.defaultIdorRange} onChange={(e) => handleNestedChange('scanning','defaultIdorRange', e.target.value)} />
                 <p className="text-xs text-muted-foreground">For the IDOR Scanner (e.g., "1-100").</p>
              </div>
            </div>

            <div className="space-y-4">
               <Label className="font-semibold">Global Network Settings</Label>
               <div className="space-y-2">
                 <Label htmlFor="globalTimeout">API Timeout (ms)</Label>
                 <Input id="globalTimeout" type="number" value={settings.scanning.globalTimeout} onChange={(e) => handleNestedChange('scanning','globalTimeout', Number(e.target.value))} />
                 <p className="text-xs text-muted-foreground">Timeout for external API calls (e.g., WHOIS, VirusTotal).</p>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="userAgent">Custom User-Agent</Label>
                 <Input id="userAgent" value={settings.scanning.userAgent} onChange={(e) => handleNestedChange('scanning','userAgent', e.target.value)} />
                 <p className="text-xs text-muted-foreground">Used for server-side `fetch` requests to external sites.</p>
               </div>
            </div>

            <div className="space-y-4">
               <Label className="font-semibold">Tool Visibility</Label>
               <ScrollArea className="h-48 border rounded-md p-4">
                <div className="space-y-2">
                {scanningTools.map(tool => (
                  <div key={tool.id} className="flex items-center justify-between">
                    <Label htmlFor={tool.id} className="font-normal">{tool.label}</Label>
                    <Switch
                      id={tool.id}
                      checked={!!settings.scanning[tool.id as keyof typeof settings.scanning]}
                      onCheckedChange={(checked) => handleVisibilityChange(tool.id, checked)}
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
              Save Scanning Settings
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
