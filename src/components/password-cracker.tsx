
'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, KeyRound, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import MD5 from 'crypto-js/md5';
import SHA1 from 'crypto-js/sha1';
import SHA256 from 'crypto-js/sha256';

const formSchema = z.object({
  hash: z.string().min(32, { message: 'Please enter a valid hash.' }),
  hashType: z.string().min(1, { message: 'Please select a hash type.' }),
  wordlistSource: z.enum(['rockyou', 'top1000', 'custom']),
});

const hashTypes = ['MD5', 'SHA1', 'SHA256'];
const simulatedWordlists: Record<string, string[]> = {
    'rockyou': ['password', '123456', 'qwerty', 'dragon', 'sunshine', 'princess', 'football', 'monkey', 'shadow', 'admin', 'hunter', 'iloveyou'],
    'top1000': ['love', 'god', 'secret', 'money', 'magic', 'master', 'system', 'hello', 'welcome'],
};

const runAsyncTask = (task: Generator): Promise<void> => {
    return new Promise((resolve) => {
        const step = () => {
            const result = task.next();
            if (result.done) { resolve(); } 
            else { setTimeout(step, 0); }
        };
        step();
    });
};


export function PasswordCracker() {
  const [result, setResult] = useState<{ isCracked: boolean, crackedPassword?: string, log: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [customWordlist, setCustomWordlist] = useState<string[]>([]);
  const customFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hash: '5f4dcc3b5aa765d61d8327deb882cf99', // MD5 for 'password'
      hashType: 'MD5',
      wordlistSource: 'rockyou',
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const content = event.target?.result as string;
              setCustomWordlist(content.split(/\r?\n/));
          };
          reader.readAsText(file);
      }
  };

  const getHash = (text: string, type: string): string => {
      switch (type) {
        case 'MD5': return MD5(text).toString();
        case 'SHA1': return SHA1(text).toString();
        case 'SHA256': return SHA256(text).toString();
        default: return '';
      }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setProgress(0);

    let wordlist: string[] = [];
    let wordlistName = '';

    if (values.wordlistSource === 'custom') {
        if(customWordlist.length === 0) {
             setError("Please select a custom wordlist file.");
             setIsLoading(false);
             return;
        }
        wordlist = customWordlist;
        wordlistName = customFileRef.current?.files?.[0]?.name || 'custom';
    } else {
        wordlist = simulatedWordlists[values.wordlistSource];
        wordlistName = `${values.wordlistSource}.txt (simulated)`;
    }

    let logText = `Session starting...\n`;
    logText += `Hash Type: ${values.hashType}\n`;
    logText += `Wordlist: ${wordlistName} (${wordlist.length} words)\n`;
    logText += `Target Hash: ${values.hash}\n\n`;
    
    setResult({ isCracked: false, log: logText });
    
    let crackedPassword: string | undefined = undefined;

    const crackingTask = function* () {
      for (let i = 0; i < wordlist.length; i++) {
        const word = wordlist[i];
        if (getHash(word, values.hashType) === values.hash) {
          crackedPassword = word;
          return;
        }
        if (i % Math.floor(wordlist.length / 20) === 0 || i === wordlist.length - 1) {
            setProgress(Math.round(((i + 1) / wordlist.length) * 100));
            yield;
        }
      }
    };
    
    await runAsyncTask(crackingTask());
    setProgress(100);

    if (crackedPassword) {
      setResult(prev => ({
        isCracked: true,
        crackedPassword: crackedPassword,
        log: prev!.log + `\nStatus: CRACKED!\nFound: ${values.hash}:${crackedPassword}\n`,
      }));
    } else {
      setResult(prev => ({
        isCracked: false,
        log: prev!.log + `\nStatus: Exhausted wordlist. Password not found.\n`,
      }));
    }

    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Cracker</CardTitle>
        <CardDescription>Perform a dictionary attack against a password hash using simulated or custom wordlists.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Hash</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter hash..." {...field} className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="hashType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hash Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {hashTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
                control={form.control}
                name="wordlistSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wordlist Source</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div><RadioGroupItem value="rockyou" id="rockyou" className="peer sr-only" /><Label htmlFor="rockyou" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">rockyou.txt <span className="text-xs text-muted-foreground">(simulated)</span></Label></div>
                        <div><RadioGroupItem value="top1000" id="top1000" className="peer sr-only" /><Label htmlFor="top1000" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">top1000.txt <span className="text-xs text-muted-foreground">(simulated)</span></Label></div>
                        <div><RadioGroupItem value="custom" id="custom" className="peer sr-only" /><Label htmlFor="custom" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Custom File <span className="text-xs text-muted-foreground">(.txt)</span></Label></div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
            />
            {form.watch('wordlistSource') === 'custom' && (
                <FormItem>
                  <FormLabel>Custom Wordlist File</FormLabel>
                  <FormControl><Input type="file" accept=".txt" ref={customFileRef} onChange={handleFileChange} /></FormControl>
                </FormItem>
            )}

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crack Hash
            </Button>
          </form>
        </Form>
      </CardContent>
      
      {(error || isLoading || result) && (
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {isLoading && (
                 <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Cracking in progress...</span>
                        <span className="font-bold text-lg">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            )}

            {result && !isLoading && (
                <>
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-lg">Result:</h3>
                        {result.isCracked ? (
                            <Badge variant="destructive" className="text-base">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                CRACKED
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="text-base">
                                <XCircle className="mr-2 h-4 w-4" />
                                NOT FOUND
                            </Badge>
                        )}
                    </div>
                    {result.isCracked && result.crackedPassword && (
                        <div className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-accent" />
                            <span className="font-semibold">Password:</span>
                            <span className="font-mono bg-primary/20 p-1 rounded-sm">{result.crackedPassword}</span>
                        </div>
                    )}
                    <div>
                    <h4 className="font-semibold mb-2">Cracker Output Log:</h4>
                    <pre className="bg-primary/20 p-4 rounded-md text-sm text-foreground overflow-x-auto font-mono max-h-60">
                        <code>{result.log}</code>
                    </pre>
                    </div>
                </>
            )}
        </CardFooter>
      )}
    </Card>
  );
}
