
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Code2, Sparkles, Loader2 } from 'lucide-react';
import { generateDuckyScript } from '@/ai/flows/duckyscript-generator-flow';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  prompt: z.string().min(10, { message: 'Prompt must be at least 10 characters.' }),
});

const defaultScript = `REM Enter a prompt above and click "Generate Script".
REM Example: Open a hidden powershell window and download a file.`;

export function RubberDuckyEditor() {
  const [script, setScript] = useState(defaultScript);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: 'Open a hidden powershell window, download a file from http://10.10.10.1/payload.exe to the temp folder, and then execute it.',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setScript('// Generating script...');
    try {
      const response = await generateDuckyScript(values);
      setScript(response.script);
    } catch (err) {
      setScript('// Error generating script. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'The AI model failed to generate the script.',
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = () => {
    if (script && script !== defaultScript && !isLoading) {
      navigator.clipboard.writeText(script);
      toast({
        title: 'Copied!',
        description: 'DuckyScript copied to clipboard.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Code2 className="h-6 w-6" />
          <CardTitle>AI DuckyScript Generator</CardTitle>
        </div>
        <CardDescription>
          Generate USB Rubber Ducky scripts from natural language prompts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payload Prompt</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Open cmd and run ipconfig'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Script
            </Button>
          </form>
        </Form>
        <div className="space-y-2 pt-4">
          <Label htmlFor="script-editor">Generated Script</Label>
          <Textarea
            id="script-editor"
            value={script}
            readOnly
            className="font-mono h-64 bg-primary/20"
            placeholder="REM Your DuckyScript will appear here..."
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCopy} disabled={isLoading || script === defaultScript}>
          <Clipboard className="mr-2 h-4 w-4" />
          Copy Script
        </Button>
      </CardFooter>
    </Card>
  );
}
