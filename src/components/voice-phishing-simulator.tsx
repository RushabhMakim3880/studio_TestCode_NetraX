
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateVoice } from '@/ai/flows/voice-clone-flow';
import { Loader2, AlertTriangle, Sparkles, Mic, Bot } from 'lucide-react';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  text: z.string().min(10, 'Script must be at least 10 characters.'),
  voice: z.string().min(1, 'Please select a voice.'),
});

const availableVoices = ['Algenib', 'Achernar', 'Enif', 'Hadar', 'Maia', 'Izar'];

export function VoicePhishingSimulator() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "This is an urgent request. I need you to process a wire transfer for a new acquisition immediately. I'm in a meeting and can't do it myself. Please confirm you can handle this.",
      voice: 'Algenib',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateVoice(values);
      setResult(response.media);
    } catch (err) {
      setError('Failed to generate voice. The AI model may be unavailable or the request was refused.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Mic className="h-6 w-6" />
          <CardTitle>Voice Phishing (Vishing) Simulator</CardTitle>
        </div>
        <CardDescription>
          Generate realistic audio from text to simulate CEO fraud or other vishing scenarios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="text" render={({ field }) => ( <FormItem> <FormLabel>Voice Script</FormLabel> <FormControl><Textarea placeholder="Enter the text to be spoken..." {...field} className="h-32"/></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="voice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {availableVoices.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Audio
              </Button>
            </form>
          </Form>

          <div className="space-y-4">
            <Label>Generated Audio</Label>
            <div className="h-full min-h-[200px] border rounded-md p-4 bg-primary/20 flex flex-col items-center justify-center">
              {isLoading && <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}
              {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
              {!isLoading && !result && !error && (
                <div className="text-muted-foreground text-center flex flex-col items-center justify-center">
                  <Bot className="h-10 w-10 mb-2" />
                  Your generated audio will appear here.
                </div>
              )}
              {result && (
                <div className="w-full space-y-4 animate-in fade-in">
                  <p className="text-sm text-center text-muted-foreground">Audio generated successfully.</p>
                  <audio controls className="w-full">
                    <source src={result} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
