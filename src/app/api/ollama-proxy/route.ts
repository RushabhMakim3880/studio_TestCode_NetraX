'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { saveLocalAiConfig, getLocalAiConfig } from '@/services/local-ai-service';
import type { LocalAiConfig } from '@/services/local-ai-service';
import { useAuth } from '@/hooks/use-auth';

async function testOllamaConnection(baseUrl: string): Promise<{ success: boolean; message: string }> {
   try {
    const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET', mode: 'cors' });
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }
    await response.json(); // Ensure body is readable
    return { success: true, message: "Successfully connected to the Ollama server." };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (message.includes('Failed to fetch')) {
        return { success: false, message: "Connection failed. This is likely a CORS issue. Please see the setup guide and ensure Ollama is started with the correct OLLAMA_ORIGINS environment variable."};
    }
    return { success: false, message: `Connection test failed: ${message}` };
  }
}

export function LocalAiSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3');

  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [appOrigin, setAppOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppOrigin(window.location.origin);
    }
    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const config = await getLocalAiConfig();
            if (config && config.provider === 'ollama' && config.ollama) {
                setOllamaUrl(config.ollama.baseUrl);
                setOllamaModel(config.ollama.model);
            }
        } catch(e) {
            console.error("Failed to load local AI config:", e);
        } finally {
            setIsLoading(false);
        }
    };
    loadConfig();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testOllamaConnection(ollamaUrl);
    setTestResult(result);
    setIsTesting(false);
  };
  
  const handleSave = async () => {
    if(!user) return;
    setIsLoading(true);
    try {
        const config: LocalAiConfig = { 
            provider: 'ollama',
            ollama: { baseUrl: ollamaUrl, model: ollamaModel }
        };
        await saveLocalAiConfig(config);
        toast({ title: 'Local AI Settings Saved', description: 'The server will now attempt to use the configured local provider.' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Save Failed', description: e instanceof Error ? e.message : 'Could not save settings.' });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-6 w-6" />
          <CardTitle>Local AI Provider Settings</CardTitle>
        </div>
        <CardDescription>Integrate a local Ollama instance to bypass cloud quotas and content restrictions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-primary/10 border space-y-3">
            <h4 className="font-semibold">Ollama Setup Guide</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Download and install Ollama from <Link href="https://ollama.com" target="_blank" className="text-accent underline">ollama.com</Link>.</li>
                <li>Pull your desired model via your terminal: <code className="font-mono bg-background px-1 py-0.5 rounded">ollama run {ollamaModel}</code>.</li>
                <li>
                    **CRITICAL:** To fix the connection error, you must configure Ollama's CORS policy. Set this environment variable on the machine where Ollama is running **before** starting the Ollama application:
                    <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono">OLLAMA_ORIGINS="{appOrigin}"</pre>
                </li>
                <li>Start the Ollama application on your computer.</li>
                <li>Use the "Test Connection" button below to confirm the setup is working.</li>
            </ol>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="ollama-url">Ollama API Endpoint</Label>
                <Input id="ollama-url" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ollama-model">Active Model Name</Label>
                <Input id="ollama-model" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} />
            </div>
        </div>
        <div>
            <Button onClick={handleTestConnection} disabled={isTesting} variant="outline">
                {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                Test Connection
            </Button>
            {testResult && (
                <div className={`text-sm mt-2 flex items-center gap-2 ${testResult.success ? 'text-green-400' : 'text-destructive'}`}>
                    <Info className="h-4 w-4"/>
                    {testResult.message}
                </div>
            )}
        </div>
      </CardContent>
       <CardFooter className="justify-end border-t pt-6">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </CardFooter>
    </Card>
  );
}