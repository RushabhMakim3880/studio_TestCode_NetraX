
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Sparkles, Binary, CheckCircle, File, FileCode, Shield, Download, Clipboard } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  payloadFile: z.any().refine(files => files?.length === 1, "Payload file is required."),
  benignFile: z.any().refine(files => files?.length === 1, "Benign file is required."),
  iconFile: z.any().optional(),
  outputFormat: z.string().min(1),
  extensionSpoof: z.boolean(),
  fudCrypter: z.array(z.string()),
  obfuscation: z.string(),
  dropperBehavior: z.string(),
  delay: z.string().optional(),
  fakeError: z.boolean(),
  selfDestruct: z.boolean(),
  sandboxDetect: z.boolean(),
});

const outputFormats = ['.exe', '.scr', '.bat', '.js', '.vbs', '.hta'];
const crypterTechniques = ['AES Encryption', 'Polymorphism', 'Junk Code Insertion'];
const obfuscationMethods = ['None', 'Base64', 'Hex', 'XOR'];
const dropperBehaviors = ['Run Silently', 'Drop & Exec (Temp)', 'Persistence (Startup)'];

export default function MergingStationPage() {
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finalOutput, setFinalOutput] = useState<{name: string, vtScore: string} | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outputFormat: '.exe',
      extensionSpoof: true,
      fudCrypter: ['AES Encryption'],
      obfuscation: 'Base64',
      dropperBehavior: 'Run Silently',
      delay: '0',
      fakeError: true,
      selfDestruct: true,
      sandboxDetect: true,
    },
  });

  const runBuildProcess = async (values: z.infer<typeof formSchema>) => {
    setIsBuilding(true);
    setBuildLog([]);
    setProgress(0);
    setFinalOutput(null);

    const log = (message: string, delay = 200) => {
      return new Promise(resolve => {
        setTimeout(() => {
          setBuildLog(prev => [...prev, message]);
          setProgress(prev => Math.min(prev + (100 / 10), 100));
          resolve(true);
        }, delay);
      });
    };

    try {
      await log(`Build started for ${values.payloadFile[0].name} + ${values.benignFile[0].name}`);
      if(values.fudCrypter.length > 0) await log(`Applying crypter techniques: ${values.fudCrypter.join(', ')}`);
      if(values.obfuscation !== 'None') await log(`Encoding payload with ${values.obfuscation}...`);
      await log(`Merging payload with benign file...`);
      if(values.iconFile?.[0]) await log(`Injecting custom icon: ${values.iconFile[0].name}`);
      if(values.dropperBehavior.includes('Delay')) await log(`Setting execution delay to ${values.delay} seconds.`);
      if(values.sandboxDetect) await log('Injecting anti-sandbox/VM detection stubs...');
      await log(`Configuring dropper behavior: ${values.dropperBehavior}`);
      if(values.fakeError) await log('Adding fake error message module...');
      if(values.selfDestruct) await log('Adding self-destruct mechanism...');
      await log('Packing final output...');

      const benignFileName = values.benignFile[0].name.split('.')[0];
      const benignFileExt = values.benignFile[0].name.split('.').pop();
      const finalName = values.extensionSpoof 
        ? `${benignFileName}.${benignFileExt}${'\u202E'}exe`
        : `${benignFileName}${values.outputFormat}`;
      
      const vtScore = `${Math.floor(Math.random() * 3)}/70 engines detected`;
      setFinalOutput({ name: finalName, vtScore });
      
      await log(`Build complete. Output file: ${finalName}`);
      toast({ title: 'Build Successful', description: 'Simulated build process completed.' });

    } catch (e) {
      toast({ variant: 'destructive', title: 'Build Failed', description: 'An unexpected error occurred during simulation.' });
    } finally {
      setIsBuilding(false);
      setProgress(100);
    }
  };

  const handleDownload = () => {
    if(!finalOutput) return;
    const blob = new Blob(["This is a dummy file for simulation."], { type: "text/plain" });
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
                  <FormField control={form.control} name="payloadFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Malicious Payload</FormLabel><FormControl><Input type="file" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="benignFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Benign File (Decoy)</FormLabel><FormControl><Input type="file" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="iconFile" render={({ field: { onChange, onBlur, name, ref } }) => (<FormItem><FormLabel>Custom Icon (Optional)</FormLabel><FormControl><Input type="file" accept=".ico" onChange={e => onChange(e.target.files)} onBlur={onBlur} name={name} ref={ref} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">2. Output Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="outputFormat" render={({ field }) => (
                    <FormItem><FormLabel>Output Format</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{outputFormats.map(f=><SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="extensionSpoof" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label className="font-normal">Use Extension Spoofing (RLO)</Label></FormItem>)} />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-lg">3. Evasion & Obfuscation</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div>
                        <FormField control={form.control} name="fudCrypter" render={() => (
                            <FormItem>
                                <FormLabel>Crypter Techniques</FormLabel>
                                {crypterTechniques.map(item => (
                                    <FormField key={item} control={form.control} name="fudCrypter" render={({field})=>(
                                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                                            <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={checked=>{return checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter(v=>v!==item))}}/></FormControl>
                                            <FormLabel className="font-normal">{item}</FormLabel>
                                        </FormItem>
                                    )}/>
                                ))}
                            </FormItem>
                        )}/>
                    </div>
                    <FormField control={form.control} name="obfuscation" render={({ field }) => (
                        <FormItem><FormLabel>Encoder</FormLabel><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="mt-2 space-y-1">{obfuscationMethods.map(m=><FormItem key={m} className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value={m} /></FormControl><Label className="font-normal">{m}</Label></FormItem>)}</RadioGroup></FormItem>
                    )}/>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-lg">4. Behavior & Persistence</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="dropperBehavior" render={({ field }) => (
                        <FormItem><FormLabel>Dropper Behavior</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{dropperBehaviors.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></FormItem>
                    )} />
                     <FormField control={form.control} name="delay" render={({ field }) => (<FormItem><FormLabel>Execution Delay (seconds)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                    <div className="space-y-2">
                        <FormField control={form.control} name="fakeError" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label className="font-normal">Show Fake Error Message</Label></FormItem>)} />
                        <FormField control={form.control} name="selfDestruct" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label className="font-normal">Self-Destruct After Execution</Label></FormItem>)} />
                        <FormField control={form.control} name="sandboxDetect" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label className="font-normal">Enable Anti-Sandbox/VM Detection</Label></FormItem>)} />
                    </div>
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
