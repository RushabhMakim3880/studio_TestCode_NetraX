
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bot, Clipboard, Info, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const BOT_FATHER_URL = 'https://t.me/BotFather';

export function TelegramSetupGuide() {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tokenPlaceholder = '{YOUR_BOT_TOKEN}';
      const baseUrl = `${window.location.origin}/api/c2/telegram/webhook/${tokenPlaceholder}`;
      setWebhookUrl(baseUrl);
      setRegistrationUrl(`https://api.telegram.org/bot${tokenPlaceholder}/setWebhook?url=${baseUrl}`);
    }
  }, []);

  const handleCopy = (textToCopy: string) => {
    // Replace the placeholder with a user-friendly version for copying
    const userFriendlyText = textToCopy.replace('{YOUR_BOT_TOKEN}', '<PASTE_YOUR_TOKEN_HERE>');
    navigator.clipboard.writeText(userFriendlyText);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Bot className="h-6 w-6" />
            <CardTitle>Telegram C2 Setup</CardTitle>
        </div>
        <CardDescription>Follow these steps to configure your Telegram bot for two-way communication.</CardDescription>
      </CardHeader>
      <CardContent>
         <Accordion type="multiple" className="w-full" defaultValue={['step-1', 'step-2', 'step-3']}>
          <AccordionItem value="step-1">
            <AccordionTrigger className="font-semibold">Step 1: Create a Bot & Get Token</AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2 text-sm text-muted-foreground">
              <p>You need a unique API token to control your bot. You can get this from the official "BotFather" on Telegram.</p>
              <Button asChild variant="outline">
                <a href={BOT_FATHER_URL} target="_blank" rel="noopener noreferrer">
                  Open @BotFather <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <p>In your chat with BotFather, send the <code className="bg-primary/20 p-1 rounded-sm">/newbot</code> command and follow the instructions. BotFather will give you a token that looks something like this: <code className="bg-primary/20 p-1 rounded-sm">7428053763:AAHJpZBa4seaHr9FoihC6...</code></p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="step-2">
            <AccordionTrigger className="font-semibold">Step 2: Set Your Webhook</AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2 text-sm text-muted-foreground">
              <p>Next, you must tell Telegram where to send messages. Construct the URL below by replacing BOTH placeholders with your bot token. Then, visit the completed URL in your browser.</p>
              <div className="p-2 border rounded-md bg-primary/20">
                  <pre className="text-xs break-all font-mono relative pr-10">
                    <code>{registrationUrl}</code>
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => handleCopy(registrationUrl)}>
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </pre>
              </div>
              <p>After visiting the link, Telegram should show a success message: <code className="bg-primary/20 p-1 rounded-sm">{"{ 'ok': true, 'result': true, 'description': 'Webhook was set' }"}</code></p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="step-3" className="border-b-0">
            <AccordionTrigger className="font-semibold">Step 3: Connect & Interact</AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2 text-sm text-muted-foreground">
               <p>Your bot is now automated! Use the "C2 Control Panel" below to connect NETRA-X to your bot and start sending messages or commands. </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Paste your bot token into the control panel and click "Connect".</li>
                  <li>Find your bot on Telegram and send the `/start` command. It will reply with your unique Chat ID.</li>
                  <li>Use that Chat ID in the control panel to send messages or commands like `!ping`.</li>
                </ol>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </CardContent>
    </Card>
  );
}
