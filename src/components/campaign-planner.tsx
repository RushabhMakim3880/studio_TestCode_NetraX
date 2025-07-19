
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { generateCampaignPlan, type CampaignPlannerOutput } from '@/ai/flows/campaign-planner-flow';
import { Loader2, AlertTriangle, Sparkles, Map, Bot, User, Clock, Tag, DollarSign } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  objective: z.string().min(10, 'Objective must be at least 10 characters.'),
  targetDescription: z.string().min(10, 'Target description must be at least 10 characters.'),
});

const DEFAULT_HOURLY_RATE = 150; // USD

export function CampaignPlanner() {
  const [result, setResult] = useState<CampaignPlannerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective: "Gain domain admin access and exfiltrate the customer database.",
      targetDescription: "A mid-sized e-commerce company with a public-facing web portal, corporate VPN, and a standard set of employee roles (IT, finance, marketing).",
    },
  });

  const { totalHours, totalCost } = useMemo(() => {
    if (!result) return { totalHours: 0, totalCost: 0 };
    const hours = result.phases.flatMap(p => p.steps).reduce((sum, step) => sum + step.estimatedHours, 0);
    return {
      totalHours: hours,
      totalCost: hours * DEFAULT_HOURLY_RATE,
    };
  }, [result]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateCampaignPlan(values);
      setResult(response);
    } catch (err) {
      setError('Failed to generate project plan. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Map className="h-6 w-6" />
          <CardTitle>AI Project Planner</CardTitle>
        </div>
        <CardDescription>
          Describe a high-level objective and let the AI strategist create a phased project plan with timelines and cost estimates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="objective" render={({ field }) => ( <FormItem> <FormLabel>Project Objective</FormLabel> <FormControl><Input placeholder="e.g., Exfiltrate financial reports..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="targetDescription" render={({ field }) => ( <FormItem> <FormLabel>Target Description</FormLabel> <FormControl><Textarea placeholder="Describe the target organization..." {...field} className="h-28"/></FormControl> <FormMessage /> </FormItem> )}/>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Plan
                </Button>
              </form>
            </Form>

            {result && (
              <Card className="bg-primary/20">
                <CardHeader>
                  <CardTitle>Project Valuation</CardTitle>
                  <CardDescription>Simulated cost estimate based on default rates.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{totalHours}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Cost</p>
                      <p className="text-2xl font-bold">${totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          <div className="space-y-4">
            <Label>Generated Plan</Label>
            <div className="h-full min-h-[500px] border rounded-md p-4 bg-primary/20 space-y-4 overflow-y-auto">
              {isLoading && <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}
              {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
              {!isLoading && !result && (
                <div className="text-muted-foreground text-center flex flex-col items-center justify-center min-h-[400px]">
                  <Bot className="h-10 w-10 mb-2" />
                  Your generated project plan will appear here.
                </div>
              )}

              {result && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-xl font-bold text-accent">{result.planTitle}</h3>
                  <p className="text-sm text-muted-foreground">{result.executiveSummary}</p>
                  <Accordion type="multiple" className="w-full" defaultValue={result.phases.map(p => p.phaseName)}>
                    {result.phases.map((phase) => (
                      <AccordionItem value={phase.phaseName} key={phase.phaseName}>
                        <AccordionTrigger className="text-base font-semibold hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-2">
                            <span>{phase.phaseName}</span>
                            <span className="text-sm font-normal text-muted-foreground">{phase.timeline}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {phase.steps.map((step, idx) => (
                              <div key={idx} className="p-3 bg-background/50 rounded-md border text-sm">
                                <p className="font-semibold">{step.action}</p>
                                <p className="text-xs text-muted-foreground mt-2">{step.justification}</p>
                                <div className="flex items-center justify-between mt-3 text-xs border-t pt-2">
                                  <div className="flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground"/>{step.resourceType}</div>
                                  <div className="flex items-center gap-1.5"><Tag className="h-3 w-3 text-muted-foreground"/>{step.tool}</div>
                                  <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-muted-foreground"/>{step.estimatedHours} hrs</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
