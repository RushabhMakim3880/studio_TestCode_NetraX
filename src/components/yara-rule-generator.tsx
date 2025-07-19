
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { generateYaraRule } from '@/ai/flows/yara-rule-generator-flow';
import { Loader2, AlertTriangle, Clipboard, Code, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
});

const defaultRule = `/* 
  Describe the malware characteristics in the text area above.
  For example: "A PE file that contains the string 'evilcorp' and creates a mutex named 'Global\\EvilMutex'."
  Then click "Generate Rule" to see the AI-generated Yara rule here.
*/`;

export function YaraRuleGenerator() {
  const [result, setResult] = useState<string>(defaultRule);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "A Windows executable that communicates with the C2 server at evil.com and looks for files with the .bak extension.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult('// Generating YARA rule...');
    setError(null);
    try {
      const response = await generateYaraRule(values);
      setResult(response.rule);
    } catch (err) {
      setError('Failed to generate Yara rule. The request may have been blocked.');
      setResult('// Error generating rule.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleCopy = () => {
    if (result && result !== defaultRule && !isLoading && !error) {
      navigator.clipboard.writeText(result);
      toast({
        title: 'Copied!',
        description: 'Yara rule copied to clipboard.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Code className="h-6 w-6" />
          <CardTitle>AI Yara Rule Generator</CardTitle>
        </div>
        <CardDescription>Generate Yara rules for malware detection from natural language descriptions.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Malware Characteristics</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the malware's strings, behavior, or indicators..." {...field} className="h-40 font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Rule
            </Button>
          </form>
        </Form>
        <div className="space-y-2">
            <Label htmlFor="yara-output">Generated Rule</Label>
             {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
             <div className="relative">
                <Textarea id="yara-output" value={result} readOnly className="font-mono h-52 bg-primary/20" />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy} disabled={!result || result === defaultRule || isLoading}>
                    <Clipboard className="h-4 w-4" />
                </Button>
             </div>
        </div>
      </CardContent>
    </Card>
  );
}
