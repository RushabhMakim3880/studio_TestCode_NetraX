
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, CheckCircle, Info, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { saveLocalAiConfig, getLocalAiConfig } from '@/services/local-ai-service';
import type { LocalAiProvider, LocalAiConfig } from '@/services/local-ai-service';
import { useLocalStorage } from '@/hooks/use-local-storage';

// --- Models ---
const AVAILABLE_MODELS = [
  { id: 'llama3', name: 'Llama 3', description: 'Meta\'s latest, great for general purpose tasks.' },
  { id: 'codellama', name: 'Code Llama', description: 'Specialized for code generation and completion.' },
  { id: 'gemma', name: 'Gemma', description: 'Google\'s lightweight open model.' },
  { id: 'phi3', name: 'Phi-3', description: 'Microsoft\'s new small, capable model.' },
];

async function testOllamaConnection(baseUrl: string): Promise<{ success: boolean; message: string }> {
   try {
    const response = await fetch(baseUrl, { method: 'GET', mode: 'cors' });
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }
    return { success: true, message: "Successfully connected to the Ollama server." };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (message.includes('Failed to fetch')) {
        return { success: false, message: "Connection failed. This is likely a CORS issue. Please see the setup guide and ensure Ollama is started with the correct OLLAMA_ORIGINS environment variable."};
    }
    return { success: false, message: `Connection test failed: ${message}` };
  }
}

export function LocalAiProviderManager() {
  const { toast } = useToast();
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [appOrigin, setAppOrigin] = useState('');
  
  const [downloadedModels, setDownloadedModels] = useLocalStorage<string[]>('netra-ollama-models', []);
  const [activeModel, setActiveModel] = useLocalStorage<string | null>('netra-ollama-active-model', null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppOrigin(window.location.origin);
    }
    const loadConfig = async () => {
        try {
            const config = await getLocalAiConfig();
            if (config && config.provider === 'ollama' && config.ollama) {
                setOllamaUrl(config.ollama.baseUrl);
                if (config.ollama.model) {
                   setActiveModel(config.ollama.model);
                   if (!downloadedModels.includes(config.ollama.model)) {
                       setDownloadedModels([...downloadedModels, config.ollama.model]);
                   }
                }
            }
        } catch(e) {
            console.error("Failed to load local AI config:", e);
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
  
  const handleCopyCommand = (modelId: string) => {
      navigator.clipboard.writeText(`ollama pull ${modelId}`);
      toast({ title: "Command Copied!", description: "Paste the command into your local terminal to download the model." });
  }
  
  const handleMarkAsDownloaded = (modelId: string) => {
      if (!downloadedModels.includes(modelId)) {
          setDownloadedModels([...downloadedModels, modelId]);
      }
      if (!activeModel) {
          handleSetActive(modelId);
      }
  }

  const handleSetActive = async (modelId: string) => {
      setActiveModel(modelId);
      const config: LocalAiConfig = {
          provider: 'ollama',
          ollama: { baseUrl: ollamaUrl, model: modelId }
      };
      await saveLocalAiConfig(config);
      toast({ title: "Active Model Set!", description: `${modelId} will now be used for AI tasks.` });
  }
  
  const handleForgetModel = (modelId: string) => {
      setDownloadedModels(downloadedModels.filter(m => m !== modelId));
      if (activeModel === modelId) {
          setActiveModel(null);
      }
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-6 w-6" />
          <CardTitle>Local Ollama Manager</CardTitle>
        </div>
        <CardDescription>Manage and configure a local Ollama instance to power NETRA-X's AI features.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-primary/10 border space-y-3">
            <h4 className="font-semibold">Step 1: Run Ollama Locally</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Download and install Ollama from <Link href="https://ollama.com" target="_blank" className="text-accent underline">ollama.com</Link>.</li>
                <li>
                    **CRITICAL:** To allow NETRA-X to connect, you must configure Ollama's CORS policy. Set this environment variable on the machine where Ollama is running **before** starting the Ollama server:
                    <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono">OLLAMA_ORIGINS="{appOrigin}"</pre>
                </li>
                <li>Start the Ollama application on your computer.</li>
            </ol>
        </div>

        <div className="space-y-2">
            <Label htmlFor="ollama-url">Step 2: Connect to Ollama Server</Label>
            <div className="flex gap-2">
              <Input id="ollama-url" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} />
              <Button onClick={handleTestConnection} disabled={isTesting} variant="outline" className="shrink-0">
                  {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                  Test Connection
              </Button>
            </div>
             {testResult && (
                <div className={`text-sm mt-2 flex items-center gap-2 ${testResult.success ? 'text-green-400' : 'text-destructive'}`}>
                    <Info className="h-4 w-4"/>
                    {testResult.message}
                </div>
            )}
        </div>
        
        <div className="space-y-2">
            <Label>Step 3: Manage & Select Models</Label>
            <div className="grid md:grid-cols-2 gap-4">
                {AVAILABLE_MODELS.map(model => {
                    const isDownloaded = downloadedModels.includes(model.id);
                    const isActive = activeModel === model.id;
                    return (
                        <Card key={model.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-base">{model.name}</CardTitle>
                                <CardDescription className="text-xs">{model.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow"/>
                            <CardFooter className="flex flex-col gap-2">
                                {!isDownloaded ? (
                                    <>
                                        <Button variant="outline" className="w-full" onClick={() => handleCopyCommand(model.id)}>Copy Download Command</Button>
                                        <Button variant="secondary" className="w-full" onClick={() => handleMarkAsDownloaded(model.id)}>Mark as Downloaded</Button>
                                    </>
                                ) : (
                                     <>
                                        <Button className="w-full" onClick={() => handleSetActive(model.id)} disabled={isActive}>
                                            {isActive ? <><CheckCircle className="mr-2 h-4 w-4"/>Active</> : 'Set as Active'}
                                        </Button>
                                         <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => handleForgetModel(model.id)}>
                                            <Trash2 className="mr-1 h-3 w-3"/> Forget
                                        </Button>
                                     </>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
