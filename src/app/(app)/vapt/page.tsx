'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateComplianceChecklist, type VaptOutput } from '@/ai/flows/vapt-flow';
import { Loader2, AlertTriangle, ListChecks } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CvssCalculator } from '@/components/cvss-calculator';
import { ConfigAnalyzer } from '@/components/config-analyzer';
import { ExploitChainAssistant } from '@/components/exploit-chain-assistant';

const formSchema = z.object({
  standard: z.string().min(1, { message: 'Please select a standard.' }),
});

const complianceStandards = ['PCI-DSS v4.0', 'HIPAA', 'ISO 27001', 'SOC 2 Type II'];

export default function VaptPage() {
  const [result, setResult] = useState<VaptOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      standard: 'PCI-DSS v4.0',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateComplianceChecklist(values);
      setResult(response);
    } catch (err) {
      setError('Failed to generate checklist. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const groupedChecklist = result?.checklist.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, typeof result.checklist>);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">VAPT & Compliance</h1>
        <p className="text-muted-foreground">Assess vulnerabilities and ensure compliance.</p>
      </div>

      <ExploitChainAssistant />
      <ConfigAnalyzer />
      <CvssCalculator />

      <Card>
        <CardHeader>
          <CardTitle>Compliance Checklist Generator</CardTitle>
          <CardDescription>Generate a high-level checklist for a selected compliance standard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
              <FormField
                control={form.control}
                name="standard"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full">
                    <FormLabel>Compliance Standard</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a standard" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {complianceStandards.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Checklist
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && <Card className="border-destructive/50"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Error</CardTitle></div></CardHeader><CardContent><p>{error}</p></CardContent></Card>}

      {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

      {groupedChecklist && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3"><ListChecks className="h-6 w-6" /><CardTitle>Checklist for {form.getValues('standard')}</CardTitle></div>
            <CardDescription>High-level controls and requirements.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(groupedChecklist).map(([category, items]) => (
                <AccordionItem value={category} key={category}>
                  <AccordionTrigger>{category}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-4">
                      {items.map(item => (
                        <li key={item.id} className="text-sm text-muted-foreground">
                          <strong className="text-foreground font-mono text-xs mr-2">{item.id}</strong>
                          {item.description}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
