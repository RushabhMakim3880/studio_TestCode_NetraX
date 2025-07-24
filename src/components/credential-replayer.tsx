'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Code, Repeat } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid login URL.' }),
  usernameField: z.string().min(1, 'Username field name is required.'),
  passwordField: z.string().min(1, 'Password field name is required.'),
  usernameValue: z.string().min(1, 'Username is required.'),
  passwordValue: z.string().min(1, 'Password is required.'),
});

type GeneratedCommands = {
    curl: string;
    fetch: string;
}

export function CredentialReplayer() {
  const [commands, setCommands] = useState<GeneratedCommands | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetUrl: 'https://example.com/login',
      usernameField: 'username',
      passwordField: 'password',
      usernameValue: 'captured_user',
      passwordValue: 'captured_password123',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setCommands({
        curl: `curl -X POST -d "${values.usernameField}=${encodeURIComponent(values.usernameValue)}&${values.passwordField}=${encodeURIComponent(values.passwordValue)}" "${values.targetUrl}"`,
        fetch: `fetch("${values.targetUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    "${values.usernameField}": "${values.usernameValue}",
    "${values.passwordField}": "${values.passwordValue}",
  })
});`
    });
     toast({ title: 'Replay Scripts Generated' });
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Command copied to clipboard.' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Repeat className="h-6 w-6" />
          <CardTitle>Credential Replayer</CardTitle>
        </div>
        <CardDescription>
          Generate scripts to replay captured credentials against a login page for validation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <FormField control={form.control} name="targetUrl" render={({ field }) => (<FormItem><FormLabel>Target Login URL</FormLabel><FormControl><Input placeholder="https://example.com/login" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="usernameField" render={({ field }) => (<FormItem><FormLabel>Username Field Name</FormLabel><FormControl><Input placeholder="e.g., user, email" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="passwordField" render={({ field }) => (<FormItem><FormLabel>Password Field Name</FormLabel><FormControl><Input placeholder="e.g., pass, password" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="usernameValue" render={({ field }) => (<FormItem><FormLabel>Captured Username</FormLabel><FormControl><Input placeholder="The captured username" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="passwordValue" render={({ field }) => (<FormItem><FormLabel>Captured Password</FormLabel><FormControl><Input placeholder="The captured password" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <Button type="submit" className="w-full">
                <Code className="mr-2 h-4 w-4" />
                Generate Replay Scripts
              </Button>
            </div>
            
            <div className="space-y-4">
              {commands ? (
                <>
                  <div className="space-y-2">
                      <Label>cURL Command</Label>
                      <div className="relative">
                          <Textarea readOnly value={commands.curl} className="font-mono h-24 bg-primary/20 pr-10" />
                          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => handleCopy(commands.curl)}>
                              <Clipboard className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label>JavaScript Fetch Command</Label>
                      <div className="relative">
                          <Textarea readOnly value={commands.fetch} className="font-mono h-24 bg-primary/20 pr-10" />
                          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={()={() => handleCopy(commands.fetch)}>
                              <Clipboard className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-md bg-primary/10">
                    <p className="text-muted-foreground text-sm">Generated scripts will appear here.</p>
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
