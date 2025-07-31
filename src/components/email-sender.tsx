
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { Loader2, Mail, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generatePhishingEmail, type PhishingOutput } from '@/ai/flows/phishing-flow';
import { sendTestEmail, type SmtpConfig } from '@/actions/send-email-action';
import { useToast } from './hooks/use-toast';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import type { SentEmail } from './email-outbox';

type EmailSenderProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  phishingLink: string;
};

const formSchema = z.object({
  recipientEmail: z.string().email('Please enter a valid email address.'),
  scenario: z.string().min(10, 'Please describe the scenario for the AI.'),
});

export function EmailSender({ isOpen, onOpenChange, phishingLink }: EmailSenderProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'generate' | 'preview'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<PhishingOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { recipientEmail: '', scenario: 'An urgent security alert requires the user to verify their login credentials.' },
  });

  const onGenerate = async (values: z.infer<typeof formSchema>) => {
    setIsGenerating(true);
    setGeneratedEmail(null);
    try {
      const result = await generatePhishingEmail({
        company: 'Your Company', // This can be customized further
        role: 'Employee',
        scenario: values.scenario,
      });
      // Inject the real link
      result.body = result.body.replace(/href="#"/g, `href="${phishingLink}"`);
      setGeneratedEmail(result);
      setStep('preview');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate email content.' });
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!generatedEmail) return;
    setIsSending(true);

    try {
      const smtpConfigString = localStorage.getItem('netra-email-settings');
      if (!smtpConfigString) {
        throw new Error('SMTP settings are not configured. Please set them up on the Settings page.');
      }
      const smtpConfig: SmtpConfig = JSON.parse(smtpConfigString);
      
      const response = await sendTestEmail({
          ...smtpConfig,
          recipientEmail: form.getValues('recipientEmail'),
          subject: generatedEmail.subject,
          html: generatedEmail.body,
      });

      if (response.success) {
          toast({ title: 'Email Sent!', description: `The phishing email has been dispatched.` });
          // Log to outbox
          const sentEmails: SentEmail[] = JSON.parse(localStorage.getItem('netra-email-outbox') || '[]');
          sentEmails.unshift({
            id: crypto.randomUUID(),
            recipient: form.getValues('recipientEmail'),
            subject: generatedEmail.subject,
            status: 'Sent',
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem('netra-email-outbox', JSON.stringify(sentEmails.slice(0, 50)));

          onOpenChange(false);
      } else {
          throw new Error(response.message);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Send Failed', description: e instanceof Error ? e.message : 'An unknown error occurred.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setGeneratedEmail(null);
    setStep('generate');
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5"/> Send Phishing Email</DialogTitle>
          <DialogDescription>
            {step === 'generate'
              ? 'Generate a custom email with your phishing link embedded using AI.'
              : 'Review the generated email before sending.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'generate' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onGenerate)} className="py-4 space-y-4">
              <FormField control={form.control} name="recipientEmail" render={({ field }) => ( <FormItem><FormLabel>Recipient Email</FormLabel><FormControl><Input {...field} placeholder="target@example.com"/></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="scenario" render={({ field }) => ( <FormItem><FormLabel>Phishing Scenario</FormLabel><FormControl><Textarea {...field} placeholder="Describe the email's pretext for the AI..." /></FormControl><FormMessage /></FormItem> )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                  Generate Email
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === 'preview' && generatedEmail && (
          <div className="space-y-4 py-4">
            <div className="space-y-1">
                <Label>Subject</Label>
                <p className="p-2 bg-primary/10 rounded-md text-sm">{generatedEmail.subject}</p>
            </div>
             <div className="space-y-1">
                <Label>Body Preview</Label>
                <div className="p-4 border rounded-md max-h-60 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: generatedEmail.body }}/>
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setStep('generate')}>Back</Button>
                <Button disabled={isSending} onClick={handleSend}>
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Send Email
                </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
