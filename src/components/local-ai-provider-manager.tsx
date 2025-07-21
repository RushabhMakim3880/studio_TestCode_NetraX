
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, CheckCircle, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

type Provider = 'ollama' | 'google-cli' | 'generic';

export function LocalAiProviderManager() {
  const { toast } = useToast();
  const [provider, setProvider] = useState<Provider>('ollama');
  
  // State for each provider
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [googleCliPath, setGoogleCliPath] = useState('/usr/local/bin/gemma');
  const [googleCliModel, setGoogleCliModel] = useState('gemma:2b');
  const [genericUrl, setGenericUrl] = useState('http://localhost:1234/v1');
  const [genericModel, setGenericModel] = useState('lm-studio-model');
  const [genericApiKey, setGenericApiKey] = useState('');

  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    // This is a simulation. In a real app, this would make a server-side call.
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (provider === 'ollama' && ollamaUrl.includes('localhost')) {
      setTestResult({ success: true, message: `Successfully connected to Ollama at ${ollamaUrl}. Model '${ollamaModel}' is assumed to be available.` });
    } else if (provider === 'google-cli' && googleCliPath) {
      setTestResult({ success: true, message: `Google AI CLI provider configured. Will attempt to use '${googleCliPath}' with model '${googleCliModel}'.` });
    } else if (provider === 'generic' && genericUrl.includes('localhost')) {
        setTestResult({ success: true, message: `Successfully connected to generic endpoint at ${genericUrl}.` });
    }
    else {
       setTestResult({ success: false, message: `Connection test failed. Please verify your settings and that the service is running.` });
    }

    setIsTesting(false);
  };
  
  const handleSave = () => {
    // In a real application, these settings would be saved to a user-specific config file on the server.
    // For this simulation, we'll just show a success toast.
    toast({ title: 'Local AI Settings Saved', description: 'The server will now attempt to use the configured local provider.' });
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
        <Tabs value={provider} onValueChange={(value) => setProvider(value as Provider)} className="w-full">
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
                            <li>Pull your desired model via terminal: <code className="font-mono bg-background px-1 py-0.5 rounded">ollama run llama3</code>.</li>
                            <li>Ensure the Ollama server is running in the background.</li>
                            <li>Enter the API endpoint (default is correct for local installs) and the exact model name you pulled (e.g., <code className="font-mono bg-background px-1 py-0.5 rounded">llama3</code>).</li>
                            <li>Click "Save Settings". NETRA-X will then proxy AI requests to your local Ollama instance.</li>
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
                            <Input id="generic-model" value={genericModel} onChange={(e) => setGenericModel(e.target.value)} placeholder="e.g., lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF" />
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
      </CardContent>
       <CardFooter className="justify-end border-t pt-6">
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </CardFooter>
    </Card>
  );
}
