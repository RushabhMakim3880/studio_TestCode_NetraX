
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { getApiKeys, saveApiKeys, ApiKeySettings } from '@/services/api-key-service';

export function ApiKeysManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ApiKeySettings>({ VIRUSTOTAL_API_KEY: '', WHOIS_API_KEY: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadKeys() {
      setIsLoading(true);
      try {
        const savedKeys = await getApiKeys();
        setSettings(savedKeys);
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Could not load API keys.';
        toast({ variant: 'destructive', title: 'Loading Failed', description: error });
      } finally {
        setIsLoading(false);
      }
    }
    loadKeys();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await saveApiKeys(settings);
        toast({ title: 'API Keys Saved', description: 'Your API keys have been securely stored.' });
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Save Failed', description: error });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <KeyRound className="h-6 w-6" />
          <CardTitle>API Key Management</CardTitle>
        </div>
        <CardDescription>Manage third-party API keys for platform integrations. Keys are stored securely on the server.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        ) : (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="VIRUSTOTAL_API_KEY">VirusTotal API Key</Label>
                    <Input 
                        id="VIRUSTOTAL_API_KEY" 
                        name="VIRUSTOTAL_API_KEY" 
                        type="password"
                        value={settings.VIRUSTOTAL_API_KEY} 
                        onChange={handleInputChange} 
                        placeholder="Enter your VirusTotal API key"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="WHOIS_API_KEY">WhoisXMLAPI Key</Label>
                    <Input 
                        id="WHOIS_API_KEY" 
                        name="WHOIS_API_KEY" 
                        type="password"
                        value={settings.WHOIS_API_KEY} 
                        onChange={handleInputChange} 
                        placeholder="Enter your WhoisXMLAPI key"
                    />
                </div>
            </div>
        )}
      </CardContent>
       <CardFooter className="justify-end border-t pt-6">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save API Keys
          </Button>
        </CardFooter>
    </Card>
  );
}
