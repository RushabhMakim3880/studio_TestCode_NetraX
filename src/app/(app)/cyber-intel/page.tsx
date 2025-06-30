'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getThreatIntel, type ThreatIntelOutput } from '@/ai/flows/cyber-intel-flow';
import { Loader2, AlertTriangle, ShieldCheck, Terminal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
});

export default function CyberIntelPage() {
  const [result, setResult] = useState<ThreatIntelOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: 'CVE-2024-12345',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await getThreatIntel(values);
      setResult(response);
    } catch (err) {
      setError('Failed to fetch threat intelligence. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Cyber Threat Intelligence</h1>
        <p className="text-muted-foreground">Monitor and analyze the latest cyber threats.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Threat Briefing Generator</CardTitle>
          <CardDescription>Enter a topic (CVE, threat actor, malware) to get an AI-generated brief.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full">
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'APT42' or 'Log4j'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Brief
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Threat Briefing: {form.getValues('topic')}</CardTitle>
            <CardDescription>Generated intelligence report.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <Terminal className="h-5 w-5" />
                Threat Summary
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{result.brief}</p>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Affected Systems
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.affectedSystems.map((sys, i) => <li key={i}>{sys}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                  Recommendations
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
