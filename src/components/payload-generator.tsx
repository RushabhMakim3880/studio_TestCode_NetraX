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
import { generatePayload, type PayloadGeneratorOutput } from '@/ai/flows/payload-generator-flow';
import { Loader2, AlertTriangle, Terminal, Sparkles, Clipboard, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  payloadType: z.string().min(1, { message: 'Please select a payload type.' }),
  lhost: z.string().ip({ message: 'Please enter a valid IP address.' }),
  lport: z.string().regex(/^\d+$/, { message: 'Port must be a number.' }).min(1, { message: 'Port is required.' }),
});

const payloadTypes = [
  'Powershell TCP Reverse Shell',
  'Bash TCP Reverse Shell',
  'Python3 Reverse Shell',
  'Netcat Reverse Shell',
  'PHP Reverse Shell',
];

export function PayloadGenerator() {
  const [result, setResult] = useState<PayloadGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payloadType: 'Powershell TCP Reverse Shell',
      lhost: '10.10.10.5',
      lport: '4444',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generatePayload(values);
      setResult(response);
    } catch (err) {
      setError('Failed to generate payload. The request may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Payload copied to clipboard.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Terminal className="h-6 w-6" />
            <CardTitle>Reverse Shell Payload Generator</CardTitle>
        </div>
        <CardDescription>Generate common reverse shell payloads with AI assistance.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="payloadType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payload Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {payloadTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lhost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LHOST (Your IP)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 10.0.2.15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LPORT (Your Port)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 9001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Payload
            </Button>
          </form>
        </Form>
      </CardContent>
      
      {error && <CardFooter className="flex-col items-start gap-2 border-t pt-6"><div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div></CardFooter>}

      {isLoading && <CardFooter className="border-t pt-6"><div className="flex w-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></CardFooter>}

      {result && (
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            <div>
              <Label>Generated Payload</Label>
              <div className="flex w-full items-center gap-2 mt-1">
                  <Textarea readOnly value={result.payload} className="font-mono bg-primary/20" rows={4}/>
                  <Button type="button" size="icon" variant="outline" onClick={() => handleCopy(result.payload)}>
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
            </div>
             <Card className="w-full bg-primary/20 border-accent/30">
                <CardHeader className="flex-row items-center gap-2 space-y-0 p-3">
                    <Info className="h-4 w-4 text-accent" />
                    <CardTitle className="text-base">Usage Notes</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                </CardContent>
            </Card>
        </CardFooter>
      )}
    </Card>
  );
}
