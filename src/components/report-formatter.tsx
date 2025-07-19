
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clipboard, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  severity: z.string().min(1, 'Severity is required.'),
  vulnerability: z.string().min(1, 'Vulnerability type is required.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  stepsToReproduce: z.string().min(10, 'Steps to reproduce are required.'),
  impact: z.string().min(10, 'Impact description is required.'),
  remediation: z.string().min(10, 'Remediation steps are required.'),
});

export function ReportFormatter() {
  const [markdown, setMarkdown] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: 'Insecure Direct Object Reference on /api/invoices/{id}',
      severity: 'High',
      vulnerability: 'Insecure Direct Object Reference (IDOR)',
      description: 'The endpoint for retrieving invoices does not properly validate that the logged-in user is authorized to view the requested invoice ID. This allows an authenticated user to view invoices belonging to other users by incrementing the ID in the URL.',
      stepsToReproduce: '1. Log in as user A.\n2. Navigate to view an invoice, e.g., /invoices/101.\n3. Change the ID in the URL to an invoice belonging to user B, e.g., /invoices/102.\n4. Observe that the invoice for user B is displayed.',
      impact: 'This vulnerability allows attackers to access sensitive financial data of other users, including invoice details, customer names, and amounts. This constitutes a significant data breach, violating user privacy and potentially leading to financial fraud.',
      remediation: 'Implement an authorization check on the server-side before serving an invoice. The application logic should verify that the ID of the currently authenticated user matches the user ID associated with the requested invoice ID.',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const md = `
# ${values.title}

- **Vulnerability:** ${values.vulnerability}
- **Severity:** ${values.severity}

---

## Description
${values.description}

---

## Steps to Reproduce
${values.stepsToReproduce}

---

## Impact
${values.impact}

---

## Remediation
${values.remediation}
`;
    setMarkdown(md.trim());
  }

  const handleCopy = () => {
    if (!markdown) {
      toast({ variant: 'destructive', title: 'Nothing to copy', description: 'Please generate the report first.' });
      return;
    }
    navigator.clipboard.writeText(markdown);
    toast({ title: 'Copied!', description: 'Markdown report copied to clipboard.' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <CardTitle>Bug Bounty Report Formatter</CardTitle>
        </div>
        <CardDescription>Fill out the form to generate a clean, professional Markdown report for submission.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Report Title</FormLabel><FormControl><Input placeholder="e.g., Stored XSS in user profile" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vulnerability" render={({ field }) => (<FormItem><FormLabel>Vulnerability Type</FormLabel><FormControl><Input placeholder="e.g., SQL Injection" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="severity" render={({ field }) => (<FormItem><FormLabel>Severity</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Critical">Critical</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem><SelectItem value="Informational">Informational</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed description of the vulnerability." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="stepsToReproduce" render={({ field }) => (<FormItem><FormLabel>Steps to Reproduce</FormLabel><FormControl><Textarea placeholder="1. Go to...\n2. Click on...\n3. Observe..." {...field} className="h-28" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="impact" render={({ field }) => (<FormItem><FormLabel>Impact</FormLabel><FormControl><Textarea placeholder="What is the security impact of this vulnerability?" {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="remediation" render={({ field }) => (<FormItem><FormLabel>Remediation</FormLabel><FormControl><Textarea placeholder="How can this vulnerability be fixed?" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" className="w-full">Generate Report</Button>
            </form>
          </Form>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Markdown Output</Label>
              <Button variant="outline" size="sm" onClick={handleCopy}><Clipboard className="mr-2 h-4 w-4" /> Copy</Button>
            </div>
            <Textarea readOnly value={markdown} className="h-full min-h-[500px] font-mono bg-primary/20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
