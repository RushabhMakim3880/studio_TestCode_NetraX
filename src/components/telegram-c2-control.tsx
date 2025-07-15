
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription as FormDesc } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { connectTelegramBot, sendTelegramPayload } from '@/ai/flows/telegram-c2-flow';
import { Loader2, Bot, Send, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

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

const STORAGE_KEY = 'netra-telegram-bot-token';

export function TelegramC2Control() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [botName, setBotName] = useState<string | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);
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

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
        setSavedToken(token);
        connectForm.setValue('token', token);
        onConnect({ token });
    }
  }, []); // Empty dependency array ensures this runs only once on mount
  
  const addLog = (message: string, isError = false) => {
      const newLog: LogEntry = {
          timestamp: new Date().toLocaleTimeString(),
          message,
          isError,
      };
      setLogs(prev => [newLog, ...prev]);
  };

  const onConnect = async (values: z.infer<typeof connectSchema>) => {
    setIsConnecting(true);
    addLog(`Attempting to connect with token...`);
    try {
      const response = await connectTelegramBot(values);
      addLog(response.message, !response.success);
      setIsConnected(response.success);
      if (response.success && response.botName) {
        setBotName(response.botName);
        localStorage.setItem(STORAGE_KEY, values.token);
        setSavedToken(values.token);
      } else {
        setBotName(null);
        localStorage.removeItem(STORAGE_KEY);
        setSavedToken(null);
      }
    } catch (err) {
      const errorMessage = 'Failed to connect. An error occurred in the server action.';
      addLog(errorMessage, true);
      console.error(err);
    } finally {
        setIsConnecting(false);
    }
  };

  const onSend = async (values: z.infer<typeof sendSchema>) => {
    if (!savedToken) {
      toast({ variant: 'destructive', title: 'Error', description: 'No active bot token found.' });
      return;
    }
    addLog(`Sending message to chat ID: ${values.chatId}...`);
    try {
      const response = await sendTelegramPayload({...values, token: savedToken});
      addLog(response.message, !response.success);
      if(response.success) {
        sendForm.resetField('message');
      } else {
        toast({
          variant: 'destructive',
          title: 'Send Failed',
          description: response.message,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message.';
      addLog(errorMessage, true);
      console.error(err);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedToken(null);
    setIsConnected(false);
    setBotName(null);
    connectForm.reset({ token: '' });
    addLog('Bot disconnected and token cleared.');
    toast({ title: 'Bot Disconnected' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Bot className="h-6 w-6" />
            <CardTitle>Telegram C2 Control</CardTitle>
        </div>
        <CardDescription>Use a Telegram bot for C2 communications and payload delivery.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
            {!isConnected && (
            <Form {...connectForm}>
                <form onSubmit={connectForm.handleSubmit(onConnect)} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                        <Label>1. Connect Bot</Label>
                    </div>
                    <FormField
                    control={connectForm.control}
                    name="token"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input placeholder="Enter Telegram Bot API Token" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={isConnecting}>
                    {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect
                    </Button>
                </form>
            </Form>
            )}

            {isConnected && botName && (
                 <div className="p-4 border rounded-lg space-y-4">
                     <div className="flex justify-between items-center">
                         <Label>1. Bot Status</Label>
                         <Button variant="ghost" size="sm" onClick={handleDisconnect}><LogOut className="mr-2 h-4 w-4" /> Disconnect</Button>
                     </div>
                     <Badge variant="secondary" className="text-base w-full justify-center">
                       <CheckCircle className="mr-2 h-4 w-4 text-green-400"/> 
                       Connected as @{botName}
                    </Badge>
                </div>
            )}

            <Form {...sendForm}>
            <form onSubmit={sendForm.handleSubmit(onSend)} className="space-y-4 p-4 border rounded-lg">
                <Label>2. Send Payload / Message</Label>
                <FormField control={sendForm.control} name="chatId" render={({ field }) => (
                    <FormItem>
                        <FormControl><Input placeholder="Target Chat ID" {...field} /></FormControl>
                        <FormDesc className="text-xs px-1">
                            To find your Chat ID, message <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-accent underline">@userinfobot</a> on Telegram.
                        </FormDesc>
                        <FormMessage />
                    </FormItem>
                )} />
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
            <Label>Activity Log</Label>
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
