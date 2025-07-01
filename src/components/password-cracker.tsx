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
import { crackPassword, type PasswordCrackerOutput } from '@/ai/flows/password-cracker-flow';
import { Loader2, AlertTriangle, KeyRound, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  hash: z.string().min(32, { message: 'Please enter a valid hash.' }),
  hashType: z.string().min(1, { message: 'Please select a hash type.' }),
  wordlist: z.string().min(1, { message: 'Please select a wordlist.' }),
});

const hashTypes = ['MD5', 'SHA1', 'SHA256', 'NTLM'];
const wordlists = ['rockyou.txt (simulated)', 'top1000.txt (simulated)', 'custom-list.txt (simulated)'];

export function PasswordCracker() {
  const [result, setResult] = useState<PasswordCrackerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hash: 'e88219c40953a2341e05391512359052', // An MD5 hash for 'password'
      hashType: 'MD5',
      wordlist: 'rockyou.txt (simulated)',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await crackPassword(values);
      setResult(response);
    } catch (err) {
      setError('Failed to run the cracker simulation. The request may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Cracker Simulator</CardTitle>
        <CardDescription>Simulate a dictionary attack against a password hash.</CardDescription>
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
      
      {error && <CardFooter className="flex-col items-start gap-2 border-t pt-6"><div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div></CardFooter>}

      {isLoading && <CardFooter className="border-t pt-6"><div className="flex w-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></CardFooter>}

      {result && (
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
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
        </CardFooter>
      )}
    </Card>
  );
}
