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

const formSchema = z.object({
  description: z.string().min(10, { message: 'Please describe the bot\'s functionality in at least 10 characters.' }),
});

const defaultCode = `# Your generated Python bot code will appear here.
# Describe what you want the bot to do above, and click "Generate Bot".`;

export function TelegramBotGenerator() {
  const [result, setResult] = useState<GenerateTelegramBotOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: 'A simple echo bot that replies to any message with the same message text.',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateTelegramBot(values);
      setResult(response);
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
            <CardTitle>AI Telegram Bot Generator</CardTitle>
        </div>
        <CardDescription>Describe the bot you want to create, and the AI will generate the Python code for you.</CardDescription>
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
                    <FormLabel>Bot Functionality Description</FormLabel>
                    <FormControl>
                        <Textarea placeholder="e.g., 'A bot that replies with the current time when it receives /time'" {...field} className="h-32" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                Generate Bot
                </Button>
            </form>
            </Form>
            
            {result?.usageInstructions && (
                <Card className="mt-4 bg-primary/20 border-accent/30">
                    <CardHeader className="flex-row items-center gap-2 space-y-0 p-3">
                        <Info className="h-4 w-4 text-accent" />
                        <CardTitle className="text-base">Usage Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{result.usageInstructions}</pre>
                    </CardContent>
                </Card>
            )}
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
