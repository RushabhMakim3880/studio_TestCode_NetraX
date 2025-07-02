'use client';

import { useState } from 'react';
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
import MD5 from 'crypto-js/md5';
import SHA1 from 'crypto-js/sha1';
import SHA256 from 'crypto-js/sha256';

const formSchema = z.object({
  hash: z.string().min(32, { message: 'Please enter a valid hash.' }),
  hashType: z.string().min(1, { message: 'Please select a hash type.' }),
  wordlist: z.string().min(1, { message: 'Please select a wordlist.' }),
});

const hashTypes = ['MD5', 'SHA1', 'SHA256'];
const wordlists = ['rockyou.txt (simulated)', 'top1000.txt (simulated)', 'custom-list.txt (simulated)'];

const wordlistsData: Record<string, string[]> = {
    'rockyou.txt (simulated)': ['password', '123456', 'qwerty', 'dragon', 'sunshine', 'princess', 'football', 'monkey', 'shadow', 'admin', 'hunter', 'iloveyou'],
    'top1000.txt (simulated)': ['love', 'god', 'secret', 'money', 'magic', 'master', 'system', 'hello', 'welcome'],
    'custom-list.txt (simulated)': ['custom', 'test', 'user', 'netra', 'password123'],
};

// Helper to run a task in chunks without blocking the UI thread
const runAsyncTask = (task: Generator): Promise<void> => {
    return new Promise((resolve) => {
        const step = () => {
            const result = task.next();
            if (result.done) {
                resolve();
            } else {
                setTimeout(step, 0); // Yield to the event loop
            }
        };
        step();
    });
};


export function PasswordCracker() {
  const [result, setResult] = useState<{ isCracked: boolean, crackedPassword?: string, log: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hash: '5f4dcc3b5aa765d61d8327deb882cf99', // MD5 for 'password'
      hashType: 'MD5',
      wordlist: 'rockyou.txt (simulated)',
    },
  });
  
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

    const wordlist = wordlistsData[values.wordlist];
    if (!wordlist) {
      setError("Selected wordlist is not available for simulation.");
      setIsLoading(false);
      return;
    }

    let logText = `Session starting...\n`;
    logText += `Hash Type: ${values.hashType}\n`;
    logText += `Wordlist: ${values.wordlist} (${wordlist.length} words)\n`;
    logText += `Target Hash: ${values.hash}\n\n`;
    
    setResult({ isCracked: false, log: logText });
    
    let crackedPassword: string | undefined = undefined;

    const crackingTask = function* () {
      for (let i = 0; i < wordlist.length; i++) {
        const word = wordlist[i];
        if (getHash(word, values.hashType) === values.hash) {
          crackedPassword = word;
          return; // Exit generator
        }
        
        // Update progress periodically to avoid too many re-renders
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
        <CardDescription>Perform a dictionary attack against a password hash.</CardDescription>
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
            <div className="grid md:grid-cols-2 gap-4">
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
                name="wordlist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wordlist</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {wordlists.map((list) => <SelectItem key={list} value={list}>{list}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            
            {(isLoading || (result && progress < 100 && progress > 0)) && (
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
