'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getThreatActorProfile, ThreatActorInputSchema, type ThreatActorProfileOutput } from '@/ai/flows/threat-actor-flow';
import { Loader2, AlertTriangle, User, GitBranch, Crosshair, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function ThreatActorProfiler() {
  const [result, setResult] = useState<ThreatActorProfileOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof ThreatActorInputSchema>>({
    resolver: zodResolver(ThreatActorInputSchema),
    defaultValues: {
      actorName: 'APT28 (Fancy Bear)',
    },
  });

  async function onSubmit(values: z.infer<typeof ThreatActorInputSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await getThreatActorProfile(values);
      setResult(response);
    } catch (err) {
      setError('Failed to fetch threat actor profile. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat Actor Profiler</CardTitle>
        <CardDescription>Generate a simulated intelligence profile for a known threat actor.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="actorName"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormLabel>Threat Actor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Lazarus Group'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Profile Actor
            </Button>
          </form>
        </Form>
        
        {isLoading && <div className="flex items-center justify-center p-8 mt-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
        {error && <div className="mt-6 text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}

        {result && (
            <div className="mt-6 space-y-6">
                <CardHeader className="p-0">
                    <CardTitle className="flex items-center gap-3"><User className="h-6 w-6"/>{result.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {result.aliases.map(alias => <Badge key={alias} variant="secondary">{alias}</Badge>)}
                    </div>
                </CardHeader>
                <p className="text-sm text-muted-foreground">{result.description}</p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-2"><Crosshair className="h-5 w-5"/> Target Sectors</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.targetSectors.map(sector => <Badge key={sector} variant="outline">{sector}</Badge>)}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-2"><Code className="h-5 w-5"/> Associated Malware</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.associatedMalware.map(malware => <Badge key={malware} variant="outline" className="font-mono">{malware}</Badge>)}
                        </div>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2"><GitBranch className="h-5 w-5"/> Common TTPs (MITRE ATT&CK)</h3>
                    <Accordion type="single" collapsible className="w-full">
                        {result.commonTTPs.map(ttp => (
                            <AccordionItem value={ttp.techniqueId} key={ttp.techniqueId}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default" className="font-mono">{ttp.techniqueId}</Badge>
                                        <span>{ttp.techniqueName}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground">
                                    {ttp.description}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
