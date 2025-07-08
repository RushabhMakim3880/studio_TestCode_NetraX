'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { connectTelegramBot, sendTelegramPayload } from '@/ai/flows/telegram-c2-flow';
import { Loader2, AlertTriangle, Bot, Send, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const connectSchema = z.object({
  token: z.string().min(20, 'Token must be at least 20 characters long.'),
});

const sendSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required.'),
  message: z.string().min(1, 'Message cannot be empty.'),
});

type LogEntry = {
    timestamp: string;
    message: string;
    isError?: boolean;
}

export function TelegramC2Control() {
  const [isConnected, setIsConnected] = useState(false);
  const [botName, setBotName] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  const connectForm = useForm<z.infer<typeof connectSchema>>({
    resolver: zodResolver(connectSchema),
    defaultValues: { token: '' },
  });

  const sendForm = useForm<z.infer<typeof sendSchema>>({
    resolver: zodResolver(sendSchema),
    defaultValues: { chatId: '', message: '' },
  });
  
  const addLog = (message: string, isError = false) => {
      const newLog: LogEntry = {
          timestamp: new Date().toLocaleTimeString(),
          message,
          isError,
      };
      setLogs(prev => [newLog, ...prev]);
  };

  const onConnect = async (values: z.infer<typeof connectSchema>) => {
    addLog(`Attempting to connect with token...`);
    try {
      const response = await connectTelegramBot(values);
      addLog(response.message, !response.success);
      setIsConnected(response.success);
      if (response.success && response.botName) {
        setBotName(response.botName);
      } else {
        setBotName(null);
      }
    } catch (err) {
      const errorMessage = 'Failed to connect. The AI may have refused the request.';
      addLog(errorMessage, true);
      console.error(err);
    }
  };

  const onSend = async (values: z.infer<typeof sendSchema>) => {
    addLog(`Sending message to chat ID: ${values.chatId}...`);
    try {
      const response = await sendTelegramPayload(values);
      addLog(response.message, !response.success);
      if(response.success) {
        sendForm.resetField('message');
      }
    } catch (err) {
      const errorMessage = 'Failed to send message. The AI may have refused the request.';
      addLog(errorMessage, true);
      console.error(err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Bot className="h-6 w-6" />
            <CardTitle>Telegram C2 Control</CardTitle>
        </div>
        <CardDescription>Simulate using a Telegram bot for C2 communications and payload delivery.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <Form {...connectForm}>
            <form onSubmit={connectForm.handleSubmit(onConnect)} className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                    <FormLabel>1. Connect Bot</FormLabel>
                    {botName && (
                        <Badge variant="secondary">
                           <CheckCircle className="mr-2 h-4 w-4 text-green-400"/> 
                           Connected: @{botName}
                        </Badge>
                    )}
                     {!botName && isConnected === false && logs.length > 0 &&(
                        <Badge variant="destructive">
                           <XCircle className="mr-2 h-4 w-4"/> 
                           Connection Failed
                        </Badge>
                    )}
                </div>
                <FormField
                control={connectForm.control}
                name="token"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <Input placeholder="Enter (fake) Telegram Bot API Token" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={connectForm.formState.isSubmitting}>
                {connectForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect
                </Button>
            </form>
            </Form>

            <Form {...sendForm}>
            <form onSubmit={sendForm.handleSubmit(onSend)} className="space-y-4 p-4 border rounded-lg">
                <FormLabel>2. Send Payload / Message</FormLabel>
                <FormField control={sendForm.control} name="chatId" render={({ field }) => (<FormItem><FormControl><Input placeholder="Target Chat ID" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={sendForm.control} name="message" render={({ field }) => (<FormItem><FormControl><Textarea placeholder="Type your message or payload here..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full" disabled={sendForm.formState.isSubmitting || !isConnected}>
                {sendForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Send Message
                </Button>
            </form>
            </Form>
        </div>
        
        <div className="space-y-2">
            <FormLabel>Activity Log</FormLabel>
            <div className="h-96 bg-primary/20 p-3 rounded-md font-mono text-xs overflow-y-auto flex flex-col-reverse">
                {logs.length === 0 && <p className="m-auto text-muted-foreground">Awaiting commands...</p>}
                <div className="space-y-2">
                {logs.map((log, index) => (
                    <p key={index} className={log.isError ? 'text-red-400' : ''}>
                        <span className="text-muted-foreground/70 mr-2">{log.timestamp}</span>
                        {log.message}
                    </p>
                ))}
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
