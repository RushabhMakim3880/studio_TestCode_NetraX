'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchHibp, type HibpServiceResponse } from '@/services/hibp';
import { Loader2, AlertTriangle, DatabaseZap, ShieldOff, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  emailOrUsername: z.string().min(3, { message: 'Please enter a valid email or username.' }),
});

export function BreachDataChecker() {
  const [result, setResult] = useState<HibpServiceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrUsername: 'test@example.com',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await searchHibp(values.emailOrUsername);
      setResult(response);
    } catch (err) {
      setResult({ success: false, error: 'An unexpected error occurred.' });
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
        <CardDescription>Check an email or username against the Have I Been Pwned database.</CardDescription>
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
            
            {result && !result.success && (
                 <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{result.error}</div>
            )}
            
            {result && result.success && (
                <div>
                    {result.breaches && result.breaches.length > 0 ? (
                        <>
                            <div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 mb-4">
                                <ShieldOff className="h-8 w-8" />
                                <div>
                                    <h3 className="font-bold">Oh no — Pwned!</h3>
                                    <p className="text-sm">This account was found in {result.breaches.length} known data breaches.</p>
                                </div>
                            </div>
                            <Accordion type="multiple" className="w-full" defaultValue={[result.breaches[0].Name]}>
                                {result.breaches.map((breach) => (
                                    <AccordionItem value={breach.Name} key={breach.Name}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-3 flex-1 text-left">
                                            <img src={breach.LogoPath} alt={`${breach.Title} logo`} className="h-6 w-6" />
                                            <span className="font-semibold">{breach.Title}</span>
                                            <span className="text-muted-foreground text-sm">({breach.BreachDate})</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pl-2">
                                        <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: breach.Description }} />
                                        <div>
                                            <p className="font-semibold">Compromised data:</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {breach.DataClasses.map((data, i) => <Badge key={i} variant="secondary">{data}</Badge>)}
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
                               <p className="text-sm">This account was not found in any public breaches in the HIBP database.</p>
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
