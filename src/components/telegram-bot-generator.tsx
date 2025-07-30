
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
# Agent code will be generated here.
# Click the "Generate Agent Code" button to start.
`;

const botTemplate = `
import logging
import os
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, CallbackContext

# --- Configuration ---
# Get these from environment variables for security
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
# This is the public URL of your NETRA-X webhook (e.g., from ngrok or Vercel)
# IMPORTANT: The URL must end with your bot token for validation.
NETRAX_WEBHOOK_URL_BASE = os.getenv("NETRAX_WEBHOOK_URL_BASE", "https://your-app.vercel.app/api/c2/telegram/webhook")

# --- Logging Setup ---
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# --- Command Handlers ---

async def start(update: Update, context: CallbackContext.DEFAULT_TYPE) -> None:
    """Sends a welcome message and instructions."""
    user = update.effective_user
    await update.message.reply_html(
        rf'Hi {user.mention_html()}! I am your NETRA-X C2 agent.'
        f'Your Chat ID is: <code>{update.message.chat_id}</code>\\n\\n'
        'Send any message starting with <code>!</code> to have it processed by NETRA-X.'
        'For example: <code>!ping</code> or <code>!subdomainscan google.com</code>'
    )

async def help_command(update: Update, context: CallbackContext.DEFAULT_TYPE) -> None:
    """Sends help message."""
    await update.message.reply_text(
        'Available commands to forward to NETRA-X:\\n'
        '- !ping\\n'
        '- !subdomainscan <domain>\\n'
        '- !dnslookup <domain> <type>\\n'
        'Any other message will be ignored.'
    )

# --- Message Handler for NETRA-X Commands ---

async def handle_netra_command(update: Update, context: CallbackContext.DEFAULT_TYPE) -> None:
    """Handles messages starting with '!' and forwards them to the NETRA-X webhook."""
    message_text = update.message.text
    chat_id = update.message.chat_id
    
    if not message_text.startswith('!'):
        return

    logger.info(f"Forwarding command from chat {chat_id}: {message_text}")
    
    # Construct the full webhook URL with the bot token for security
    webhook_url = f"{NETRAX_WEBHOOK_URL_BASE}/{TELEGRAM_BOT_TOKEN}"
    
    if "YOUR_NETRAX_WEBHOOK_URL" in webhook_url:
        await update.message.reply_text("Error: NETRAX_WEBHOOK_URL_BASE is not configured on the agent.")
        return

    headers = {
        "Content-Type": "application/json",
    }
    payload = {
        "message": { # Mimic the Telegram update structure
            "text": message_text,
            "chat": {
                "id": chat_id
            }
        }
    }

    try:
        response = requests.post(webhook_url, json=payload, headers=headers)
        response.raise_for_status()  # Raises an exception for 4XX/5XX errors
        logger.info(f"Successfully sent command to NETRA-X. Status: {response.status_code}")
        # The response from the webhook is sent directly back to the user by NETRA-X
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send command to NETRA-X: {e}")
        await update.message.reply_text(f"Error: Could not contact the NETRA-X C2 server. Please check the webhook URL and server status.")

# --- Main Bot Logic ---

def main() -> None:
    """Start the bot."""
    if "YOUR_TELEGRAM_BOT_TOKEN" in TELEGRAM_BOT_TOKEN:
        logger.error("FATAL: Bot token is not configured. Please set the TELEGRAM_BOT_TOKEN environment variable.")
        return
        
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Register command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))

    # Register the message handler for commands
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_netra_command))

    logger.info("NETRA-X C2 Agent is running. Press Ctrl-C to stop.")
    application.run_polling()

if __name__ == '__main__':
    main()
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
        <CardDescription>Generate a Python agent that enables two-way communication between Telegram and NETRA-X.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Agent Functionality</FormLabel>
                    <FormControl>
                        <Textarea readOnly value={field.value} className="h-24" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                Generate Agent Code
                </Button>
            </form>
            </Form>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="setup-guide">
                <AccordionTrigger>
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Info className="h-4 w-4 text-accent"/>
                    Agent Setup Guide
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2 text-sm text-muted-foreground">
                  <p>Follow these steps to set up the two-way communication agent:</p>
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <strong>Install Python Libraries:</strong>
                      <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono">pip install python-telegram-bot requests</pre>
                    </li>
                    <li>
                      <strong>Get Bot Token:</strong> Talk to @BotFather on Telegram to create a new bot and get its unique API token.
                    </li>
                    <li>
                      <strong>Get NETRA-X Webhook Base URL**:</strong> This is the public URL of your application. For example: `https://netra-x.vercel.app`
                    </li>
                     <li>
                      <strong>Set Environment Variables:</strong> Before running the script, set these variables in your terminal. This is more secure than hard-coding them.
                      <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono">
                        export TELEGRAM_BOT_TOKEN="YOUR_TOKEN_HERE"<br/>
                        export NETRAX_WEBHOOK_URL_BASE="https://your-app.vercel.app/api/c2/telegram/webhook"
                      </pre>
                    </li>
                    <li>
                      <strong>Set the Webhook with Telegram:</strong> Open a browser and visit this URL, replacing the placeholders. This tells Telegram where to send updates.
                      <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono break-all">
                        https://api.telegram.org/bot&lt;YOUR_TOKEN&gt;/setWebhook?url=https://your-app.vercel.app/api/c2/telegram/webhook/&lt;YOUR_TOKEN&gt;
                      </pre>
                    </li>
                    <li>
                      <strong>Run the Agent:</strong> Save the generated code as a Python file (e.g., `agent.py`) and run it on a server.
                      <pre className="bg-background p-2 mt-1 rounded-md text-xs font-mono">python agent.py</pre>
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
            <Label htmlFor="bot-code-output">Generated Python Code</Label>
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
