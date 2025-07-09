
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Mail } from 'lucide-react';
import { generatePhishingEmail, type PhishingOutput } from '@/ai/flows/phishing-flow';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';

const emailSchema = z.object({
  company: z.string().min(2, { message: 'Company name is required.' }),
  role: z.string().min(2, { message: 'Target role is required.' }),
  scenario: z.string().min(10, { message: 'Scenario must be at least 10 characters.' }),
});

export function EmailGenerator() {
  const [emailResult, setEmailResult] = useState<PhishingOutput | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      company: 'Global-Corp Inc.',
      role: 'Accountant',
      scenario: 'An urgent, overdue invoice requires immediate payment.',
    },
  });

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setIsEmailLoading(true);
    setEmailResult(null);
    setEmailError(null);
    try {
      const response = await generatePhishingEmail(values);
      setEmailResult(response);
      logActivity({
          user: user?.displayName || 'Operator',
          action: 'Generated Phishing Email',
          details: `Scenario: ${values.scenario}`
      });
    } catch (err) {
      if (err instanceof Error && (err.message.includes('503') || err.message.toLowerCase().includes('overloaded'))) {
        setEmailError('The AI service is temporarily busy. Please try again.');
      } else {
        setEmailError('Failed to generate phishing email. The content may have been blocked by safety filters.');
      }
      console.error(err);
    } finally {
      setIsEmailLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Email Crafting</CardTitle>
          <CardDescription>Define the parameters for the simulated phishing email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField control={form.control} name="company" render={({ field }) => ( <FormItem> <FormLabel>Target Company</FormLabel> <FormControl><Input placeholder="e.g., Acme Corp" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="role" render={({ field }) => ( <FormItem> <FormLabel>Target Role</FormLabel> <FormControl><Input placeholder="e.g., Finance Manager" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="scenario" render={({ field }) => ( <FormItem> <FormLabel>Scenario</FormLabel> <FormControl><Textarea placeholder="Describe the phishing pretext..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <Button type="submit" disabled={isEmailLoading} className="w-full">
                {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Email
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="lg:col-span-3">
        {emailError && <Card className="border-destructive/50 mb-4"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Error</CardTitle></div></CardHeader><CardContent><p>{emailError}</p></CardContent></Card>}
        <Card className={`min-h-[400px] ${!emailResult && 'flex items-center justify-center'}`}>
          <CardHeader>
            <div className="flex items-center gap-3"><Mail className="h-6 w-6" /><CardTitle>Email Preview</CardTitle></div>
          </CardHeader>
          <CardContent>
            {!emailResult && !isEmailLoading && <p className="text-muted-foreground text-center">Generated email will be displayed here.</p>}
            {isEmailLoading && <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {emailResult && (<div className="border rounded-md p-4 bg-background"><div className="mb-4"><p className="text-sm font-bold">{emailResult.subject}</p></div><div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: emailResult.body }}/></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
