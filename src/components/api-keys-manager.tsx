
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
  const [settings, setSettings] = useState<ApiKeySettings>({ VIRUSTOTAL_API_KEY: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // In a real app, these keys would be fetched from a secure backend
    // and the user's role would be checked.
    // For this prototype, we use localStorage.
    const savedKeys = getApiKeys();
    setSettings(savedKeys);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    saveApiKeys(settings);
    setTimeout(() => {
      toast({ title: 'API Keys Saved', description: 'Note: This is a simulation. For production, use a secure vault.' });
      setIsSaving(false);
    }, 500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <KeyRound className="h-6 w-6" />
          <CardTitle>API Key Management</CardTitle>
        </div>
        <CardDescription>Manage third-party API keys for platform integrations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="virustotal_api_key">VirusTotal API Key</Label>
            <Input 
                id="virustotal_api_key" 
                name="VIRUSTOTAL_API_KEY" 
                type="password"
                value={settings.VIRUSTOTAL_API_KEY} 
                onChange={handleInputChange} 
                placeholder="Enter your VirusTotal API key"
            />
        </div>
      </CardContent>
       <CardFooter className="justify-end border-t pt-6">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save API Keys
          </Button>
        </CardFooter>
    </Card>
  );
}
