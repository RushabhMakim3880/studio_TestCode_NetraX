'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generatePhishingEmail, type PhishingOutput } from '@/ai/flows/phishing-flow';
import { Loader2, AlertTriangle, Mail } from 'lucide-react';

const formSchema = z.object({
  company: z.string().min(2, { message: 'Company name is required.' }),
  role: z.string().min(2, { message: 'Target role is required.' }),
  scenario: z.string().min(10, { message: 'Scenario must be at least 10 characters.' }),
});

export default function PhishingPage() {
  const [result, setResult] = useState<PhishingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: 'Global-Corp Inc.',
      role: 'Accountant',
      scenario: 'An urgent, overdue invoice requires immediate payment.',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generatePhishingEmail(values);
      setResult(response);
    } catch (err) {
      setError('Failed to generate phishing email. The content may have been blocked by safety filters.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Phishing Campaign Simulator</h1>
        <p className="text-muted-foreground">Generate and manage simulated phishing campaigns.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Email Generator</CardTitle>
            <CardDescription>Define the parameters for the simulated phishing email.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Company</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Finance Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scenario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scenario</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the phishing pretext..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Email
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
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

          <Card className={`min-h-[400px] ${!result && 'flex items-center justify-center'}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6" />
                <CardTitle>Email Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!result && !isLoading && <p className="text-muted-foreground text-center">Generated email will be displayed here.</p>}
              {isLoading && <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
              {result && (
                <div className="border rounded-md p-4 bg-background">
                  <div className="mb-4">
                    <p className="text-sm font-bold">{result.subject}</p>
                  </div>
                  <div
                    className="prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: result.body }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
