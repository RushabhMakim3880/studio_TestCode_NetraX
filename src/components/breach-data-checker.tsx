'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchBreachData, type BreachDataOutput } from '@/ai/flows/breach-data-flow';
import { Loader2, AlertTriangle, DatabaseZap, ShieldOff, CheckCircle, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  emailOrUsername: z.string().min(3, { message: 'Please enter a valid email or username.' }),
});

export function BreachDataChecker() {
  const [result, setResult] = useState<BreachDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrUsername: 'test@example.com',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await searchBreachData(values);
      setResult(response);
    } catch (err) {
      setError('Failed to search breach data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <DatabaseZap className="h-6 w-6" />
            <CardTitle>Breach Data Checker</CardTitle>
        </div>
        <CardDescription>Simulate searching for an email or username in a database of known data breaches.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="emailOrUsername"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormLabel>Email or Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., operator@proton.me" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check for Breaches
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {result && (
                <div>
                    {result.breaches.length > 0 ? (
                        <>
                            <div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 mb-4">
                                <ShieldOff className="h-8 w-8" />
                                <div>
                                    <h3 className="font-bold">Oh no — Pwned!</h3>
                                    <p className="text-sm">This target was found in {result.breaches.length} simulated data breaches.</p>
                                </div>
                            </div>
                            <Accordion type="multiple" className="w-full">
                                {result.breaches.map((breach, index) => (
                                    <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-3 flex-1 text-left">
                                            <span className="font-semibold">{breach.breachName}</span>
                                            <span className="text-muted-foreground text-sm">({breach.breachDate})</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pl-2">
                                        <p className="text-muted-foreground">{breach.description}</p>
                                        <div>
                                            <p className="font-semibold">Compromised data:</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {breach.compromisedData.map((data, i) => <Badge key={i} variant="secondary">{data}</Badge>)}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 p-4 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                           <ShieldCheck className="h-8 w-8" />
                            <div>
                               <h3 className="font-bold">Good news — no pwnage found!</h3>
                               <p className="text-sm">No simulated breach entries were found for this target.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
