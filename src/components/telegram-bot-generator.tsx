
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTelegramBot, type GenerateTelegramBotOutput } from '@/ai/flows/generate-telegram-bot-flow';
import { Loader2, AlertTriangle, Sparkles, Bot, Clipboard, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const formSchema = z.object({
  description: z.string().min(10, { message: 'Please describe the bot\'s functionality in at least 10 characters.' }),
});

const defaultCode = `
# This agent script is no longer required with the new Webhook setup.
# The server now handles Telegram updates directly.
# See the updated setup guide for instructions.
`;

const botTemplate = `
# This agent script is deprecated.
# The application now uses a serverless webhook to receive updates from Telegram,
# which is more efficient and reliable. Please follow the updated setup guide
# in the UI to register your webhook with the Telegram API.
`;

export function TelegramBotGenerator() {
  const [result, setResult] = useState<GenerateTelegramBotOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: 'A two-way C2 bot that forwards commands starting with ! to a NETRA-X webhook.',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateTelegramBot(values);
      setResult({
          pythonCode: botTemplate.trim(),
          usageInstructions: "See the updated setup guide.", // Placeholder, the accordion contains the real instructions
      });
    } catch (err) {
      setError('Failed to generate bot code. The AI may have refused the request due to safety policies.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleCopy = () => {
    if (result?.pythonCode) {
      navigator.clipboard.writeText(result.pythonCode);
      toast({
        title: 'Copied!',
        description: 'Bot code copied to clipboard.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <CardTitle>C2 Agent Generator</CardTitle>
        </div>
        <CardDescription>DEPRECATED: Use the guide below to set up a serverless webhook for Telegram C2.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full" defaultValue="setup-guide">
              <AccordionItem value="setup-guide">
                <AccordionTrigger>
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Info className="h-4 w-4 text-accent"/>
                    Webhook Setup Guide
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2 text-sm text-muted-foreground">
                  <p>Your application now uses a serverless webhook, which is more reliable than a running agent. Follow these steps:</p>
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <strong>Get Your Bot Token:</strong> Talk to @BotFather on Telegram to create a new bot and get its unique API token.
                    </li>
                    <li>
                      <strong>Construct Your Webhook URL:</strong> Replace `YOUR_BOT_TOKEN` in the URL below with the token you just received.
                      <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono break-all">
                       https://netra-x.vercel.app/api/c2/telegram/webhook/YOUR_BOT_TOKEN
                      </pre>
                    </li>
                     <li>
                      <strong>Register Webhook with Telegram:</strong> Construct the URL below, replacing BOTH placeholders with your bot token. Then, simply visit the URL in your browser.
                      <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono break-all">
                        https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/setWebhook?url=https://netra-x.vercel.app/api/c2/telegram/webhook/&lt;YOUR_BOT_TOKEN&gt;
                      </pre>
                      Telegram should show a success message.
                    </li>
                     <li>
                      <strong>Interact:</strong> Find your bot on Telegram and send `/start`. It will reply with your Chat ID, which you can use in the NETRA-X UI. Send commands like `!ping` to test the connection.
                    </li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="bot-code-output">Deprecated Agent Code</Label>
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
             <div className="relative">
                <Textarea id="bot-code-output" value={result?.pythonCode ?? defaultCode} readOnly className="font-mono h-96 bg-primary/20" />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy} disabled={!result?.pythonCode}>
                    <Clipboard className="h-4 w-4" />
                </Button>
             </div>
        </div>
      </CardContent>
    </Card>
  );
}
