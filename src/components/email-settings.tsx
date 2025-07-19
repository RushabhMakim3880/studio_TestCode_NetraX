
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { sendTestEmail, type SmtpConfig } from '@/actions/send-email-action';

const settingsSchema = z.object({
  smtpHost: z.string().min(1, 'Host is required'),
  smtpPort: z.string().min(1, 'Port is required').transform(Number).refine(n => !isNaN(n) && n > 0, 'Invalid port'),
  smtpUser: z.string().min(1, 'Username is required'),
  smtpPass: z.string().min(1, 'Password is required'),
  senderAddress: z.string().email('Invalid email address'),
});

export function EmailSettings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', senderAddress: '' },
  });

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('netra-email-settings');
      if (storedSettings) {
        form.reset(JSON.parse(storedSettings));
      }
    } catch (e) {
      console.error("Failed to load email settings.", e);
    }
  }, [form]);

  const onSave = (values: z.infer<typeof settingsSchema>) => {
    setIsSaving(true);
    localStorage.setItem('netra-email-settings', JSON.stringify(values));
    setTimeout(() => {
      toast({ title: 'Email Settings Saved' });
      setIsSaving(false);
    }, 500);
  };

  const handleSendTest = async () => {
    if (!testEmail) {
        toast({variant: 'destructive', title: 'Error', description: 'Recipient email is required.'})
        return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
        const settings = form.getValues();
        const response = await sendTestEmail({
            ...settings,
            recipientEmail: testEmail,
        });
        setTestResult(response);
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        setTestResult({success: false, message });
        console.error(e);
    } finally {
        setIsTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6" />
          <CardTitle>Email SMTP Settings</CardTitle>
        </div>
        <CardDescription>Configure SMTP settings for sending email invites and reports from the platform.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSave)}>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input id="smtpHost" {...form.register('smtpHost')} placeholder="smtp.example.com" />
              {form.formState.errors.smtpHost && <p className="text-sm text-destructive">{form.formState.errors.smtpHost.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input id="smtpPort" type="number" {...form.register('smtpPort')} placeholder="587" />
               {form.formState.errors.smtpPort && <p className="text-sm text-destructive">{form.formState.errors.smtpPort.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderAddress">Sender Email Address</Label>
            <Input id="senderAddress" {...form.register('senderAddress')} placeholder="noreply@netrax.local" />
            {form.formState.errors.senderAddress && <p className="text-sm text-destructive">{form.formState.errors.senderAddress.message}</p>}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input id="smtpUser" {...form.register('smtpUser')} />
              {form.formState.errors.smtpUser && <p className="text-sm text-destructive">{form.formState.errors.smtpUser.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPass">SMTP Password</Label>
              <Input id="smtpPass" type="password" {...form.register('smtpPass')} />
              {form.formState.errors.smtpPass && <p className="text-sm text-destructive">{form.formState.errors.smtpPass.message}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t pt-6">
            <Dialog>
                <DialogTrigger asChild>
                    <Button type="button" variant="outline">Send Test Email</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send a Test Email</DialogTitle>
                        <DialogDescription>Enter a recipient email to send a test message using the saved settings.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="test-email-recipient">Recipient Email</Label>
                            <Input id="test-email-recipient" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="recipient@example.com"/>
                        </div>
                        {isTesting && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>}
                        {testResult && (
                            <div className="space-y-2">
                                <Label>Result</Label>
                                <pre className={`text-xs font-mono p-3 rounded-md h-48 overflow-y-auto bg-primary/20 ${testResult.success ? '' : 'text-destructive'}`}>
                                    {testResult.message}
                                </pre>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleSendTest} disabled={isTesting}>
                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Send Test
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
            </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
