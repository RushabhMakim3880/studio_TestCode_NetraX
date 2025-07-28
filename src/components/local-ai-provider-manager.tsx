
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, CheckCircle, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { saveLocalAiConfig, getLocalAiConfig, testLocalAiConnection } from '@/services/local-ai-service';

export type LocalAiProvider = 'ollama' | 'google-cli' | 'generic';
export type LocalAiConfig = {
  provider: LocalAiProvider;
  ollama?: {
    baseUrl: string;
    model: string;
  };
  google_cli?: {
    path: string;
    model: string;
  };
  generic?: {
    baseUrl: string;
    model: string;
    apiKey?: string;
  };
};

// This function runs in the browser and can access localhost.
async function performClientSideConnectionTest(config: LocalAiConfig): Promise<{ success: boolean; message: string }> {
   try {
    switch (config.provider) {
      case 'ollama':
        if (!config.ollama) throw new Error("Ollama config is missing.");
        const ollamaResponse = await fetch(`${config.ollama.baseUrl}/api/tags`);
        if (!ollamaResponse.ok) {
            if(ollamaResponse.status === 0 || ollamaResponse.type === 'opaque') {
                 throw new Error(`Ollama API request failed due to a CORS error. Please see the setup guide.`);
            }
            throw new Error(`Ollama API returned status ${ollamaResponse.status}. Is it running?`);
        }
        const ollamaData = await ollamaResponse.json();
        const hasModel = ollamaData.models.some((m: any) => m.name.startsWith(config.ollama!.model));
        if (!hasModel) return { success: false, message: `Ollama is running, but model '${config.ollama.model}' was not found.` };
        return { success: true, message: "Successfully connected to Ollama and model is available." };

      case 'google-cli':
         // This check can only be done on the server, so we still use the server action for it.
         return await testLocalAiConnection(config);

      case 'generic':
        if (!config.generic) throw new Error("Generic endpoint config is missing.");
        const genericResponse = await fetch(`${config.generic.baseUrl}/models`, {
            headers: config.generic.apiKey ? { 'Authorization': `Bearer ${config.generic.apiKey}` } : {}
        });
        if (!genericResponse.ok) throw new Error(`Generic endpoint returned status ${genericResponse.status}.`);
        return { success: true, message: "Successfully connected to the generic OpenAI-compatible endpoint." };
        
      default:
        throw new Error("Unknown provider specified.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Connection test failed: ${message}` };
  }
}


export function LocalAiProviderManager() {
  const { toast } = useToast();
  const [provider, setProvider] = useState<LocalAiProvider>('ollama');
  
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [googleCliPath, setGoogleCliPath] = useState('/usr/local/bin/gemma');
  const [googleCliModel, setGoogleCliModel] = useState('gemma:2b');
  const [genericUrl, setGenericUrl] = useState('http://localhost:1234/v1');
  const [genericModel, setGenericModel] = useState('');
  const [genericApiKey, setGenericApiKey] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const config = await getLocalAiConfig();
            if (config) {
                setProvider(config.provider);
                if(config.ollama) {
                    setOllamaUrl(config.ollama.baseUrl);
                    setOllamaModel(config.ollama.model);
                }
                 if(config.google_cli) {
                    setGoogleCliPath(config.google_cli.path);
                    setGoogleCliModel(config.google_cli.model);
                }
                 if(config.generic) {
                    setGenericUrl(config.generic.baseUrl);
                    setGenericModel(config.generic.model);
                    setGenericApiKey(config.generic.apiKey || '');
                }
            }
        } catch(e) {
            console.error("Failed to load local AI config:", e);
        } finally {
            setIsLoading(false);
        }
    };
    loadConfig();
  }, []);

  const buildConfig = (): LocalAiConfig => {
    const config: LocalAiConfig = { provider };
    switch(provider) {
        case 'ollama':
            config.ollama = { baseUrl: ollamaUrl, model: ollamaModel };
            break;
        case 'google-cli':
            config.google_cli = { path: googleCliPath, model: googleCliModel };
            break;
        case 'generic':
            config.generic = { baseUrl: genericUrl, model: genericModel, apiKey: genericApiKey };
            break;
    }
    return config;
  }

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
        const config = buildConfig();
        const result = await performClientSideConnectionTest(config);
        setTestResult(result);
    } catch(e) {
        setTestResult({ success: false, message: e instanceof Error ? e.message : 'An unknown error occurred.' });
    } finally {
        setIsTesting(false);
    }
  };
  
  const handleSave = async () => {
    setIsLoading(true);
    try {
        const config = buildConfig();
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
        <CardDescription>Integrate local LLMs to bypass cloud quotas and content restrictions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
        <Tabs value={provider} onValueChange={(value) => setProvider(value as LocalAiProvider)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ollama">Ollama</TabsTrigger>
                <TabsTrigger value="google-cli">Google AI CLI</TabsTrigger>
                <TabsTrigger value="generic">Generic Endpoint</TabsTrigger>
            </TabsList>
            <TabsContent value="ollama" className="mt-4">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ollama-url">Ollama API Endpoint</Label>
                            <Input id="ollama-url" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ollama-model">Model Name</Label>
                            <Input id="ollama-model" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} />
                        </div>
                        <Button onClick={handleTestConnection} disabled={isTesting} variant="outline" className="w-full">
                           {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                           Test Connection
                        </Button>
                        {testResult && provider === 'ollama' && (
                            <div className={`text-sm flex items-center gap-2 ${testResult.success ? 'text-green-400' : 'text-destructive'}`}>
                                <Info className="h-4 w-4"/>
                                {testResult.message}
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 p-4 rounded-lg bg-primary/10 border">
                        <h4 className="font-semibold">Ollama Setup Guide</h4>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                            <li>Download and install Ollama from <Link href="https://ollama.com" target="_blank" className="text-accent underline">ollama.com</Link>.</li>
                            <li>Pull a model via terminal: <code className="font-mono bg-background px-1 py-0.5 rounded">ollama run llama3</code>.</li>
                            <li><strong>Important:</strong> To fix CORS errors, you must set an environment variable before starting the Ollama server.
                                <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono">export OLLAMA_ORIGINS='*'</pre>
                            </li>
                             <li>Start the Ollama server.</li>
                            <li>Enter the API endpoint (default is usually correct) and the exact model name you pulled (e.g., <code className="font-mono bg-background px-1 py-0.5 rounded">llama3</code>).</li>
                            <li>Click "Save Settings".</li>
                        </ol>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="google-cli" className="mt-4">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="gemma-path">Gemma Executable Path</Label>
                            <Input id="gemma-path" value={googleCliPath} onChange={(e) => setGoogleCliPath(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gemma-model">Model Type</Label>
                            <Input id="gemma-model" value={googleCliModel} onChange={(e) => setGoogleCliModel(e.target.value)} />
                        </div>
                        <Button onClick={handleTestConnection} disabled={isTesting} variant="outline" className="w-full">
                           {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                           Test Settings
                        </Button>
                         {testResult && provider === 'google-cli' && (
                            <div className={`text-sm flex items-center gap-2 ${testResult.success ? 'text-green-400' : 'text-destructive'}`}>
                                <Info className="h-4 w-4"/>
                                {testResult.message}
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 p-4 rounded-lg bg-primary/10 border">
                        <h4 className="font-semibold">Google AI CLI Setup Guide</h4>
                         <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                            <li>Follow the setup guide at <Link href="https://ai.google.dev/gemma/docs/gemma_cli" target="_blank" className="text-accent underline">ai.google.dev</Link> to install the `gemma` command-line tool.</li>
                            <li>Download the weights for your desired model (e.g., Gemma 2B).</li>
                            <li>Ensure the `gemma` executable is in your system's PATH or provide the full path to it.</li>
                            <li>Enter the model type (e.g., <code className="font-mono bg-background px-1 py-0.5 rounded">gemma:2b</code> or <code className="font-mono bg-background px-1 py-0.5 rounded">gemma:7b</code>).</li>
                            <li>Click "Save Settings". NETRA-X will invoke the CLI tool for AI requests.</li>
                        </ol>
                    </div>
                </div>
            </TabsContent>
             <TabsContent value="generic" className="mt-4">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="generic-url">API Base URL</Label>
                            <Input id="generic-url" value={genericUrl} onChange={(e) => setGenericUrl(e.target.value)} placeholder="http://localhost:1234/v1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="generic-model">Model Name</Label>
                            <Input id="generic-model" value={genericModel} onChange={(e) => setGenericModel(e.target.value)} placeholder="e.g., lmstudio-community/Meta-Llama-3-8B" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="generic-api-key">API Key (optional)</Label>
                            <Input id="generic-api-key" value={genericApiKey} onChange={(e) => setGenericApiKey(e.target.value)} placeholder="Leave blank if not needed" />
                        </div>
                        <Button onClick={handleTestConnection} disabled={isTesting} variant="outline" className="w-full">
                           {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                           Test Connection
                        </Button>
                         {testResult && provider === 'generic' && (
                            <div className={`text-sm flex items-center gap-2 ${testResult.success ? 'text-green-400' : 'text-destructive'}`}>
                                <Info className="h-4 w-4"/>
                                {testResult.message}
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 p-4 rounded-lg bg-primary/10 border">
                        <h4 className="font-semibold">Generic Endpoint Setup Guide</h4>
                         <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                            <li>This option is for any local server that provides an OpenAI-compatible API endpoint (e.g., LM Studio, Jan, GPT4All).</li>
                            <li>Start your local server and load a model.</li>
                            <li>Find the server's **Base URL** (e.g., `http://localhost:1234/v1`).</li>
                            <li>Find the exact **Model Name** as required by your local server.</li>
                            <li>If your server requires an API key, enter it. Otherwise, leave the field blank.</li>
                            <li>Click "Save Settings". NETRA-X will format requests to match the OpenAI API specification.</li>
                        </ol>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
        )}
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
