
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { obfuscateText, type DataObfuscatorOutput } from '@/ai/flows/data-obfuscator-flow';
import { Loader2, AlertTriangle, Sparkles, FileLock, Clipboard } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  rawText: z.string().min(10, { message: 'Please provide at least 10 characters of text.' }),
});

const defaultText = `From: John Doe <john.doe@example.com>
To: Jane Smith <jane.s@email.net>
Subject: Project Files

Hi Jane,

Can you please send me the files for the project? My phone number is 555-123-4567 if you need to call.

Thanks,
John
123 Main St, Anytown, USA`;

export function DataObfuscator() {
  const [result, setResult] = useState<DataObfuscatorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rawText: defaultText,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await obfuscateText(values);
      setResult(response);
    } catch (err) {
      setError('Failed to obfuscate text. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.obfuscatedText);
      toast({ title: 'Copied!', description: 'Obfuscated text copied to clipboard.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileLock className="h-6 w-6" />
          <CardTitle>PII Data Obfuscator</CardTitle>
        </div>
        <CardDescription>Paste text to automatically find and mask personally identifiable information (PII).</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="rawText"
                render={({ field }) => (
                  <FormItem>
                    <Label>Input Text</Label>
                    <FormControl>
                      <Textarea placeholder="Paste text containing PII here..." {...field} className="font-mono h-60" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label>Obfuscated Output</Label>
                    {result && <Button type="button" variant="ghost" size="icon" onClick={handleCopy}><Clipboard className="h-4 w-4" /></Button>}
                </div>
                 <Textarea readOnly value={result?.obfuscatedText || ''} className="font-mono h-60 bg-primary/20" />
                 {result && <p className="text-sm text-muted-foreground">{result.summary}</p>}
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
              Obfuscate Text
            </Button>
          </form>
        </Form>
        <div className="mt-4">
          {isLoading && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
          {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
