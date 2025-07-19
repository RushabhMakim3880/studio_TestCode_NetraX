
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { analyzeEmailHeaders, type EmailHeaderAnalysisOutput } from '@/ai/flows/email-header-analyzer-flow';
import { Loader2, AlertTriangle, MailSearch, Route } from 'lucide-react';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  headers: z.string().min(50, { message: 'Please paste the full email headers.' }),
});

const defaultHeaders = `Delivered-To: recipient@example.com
Received: by 2002:a05:620a:a14:b0:750:3a35:8167 with SMTP id a20csp219352qkl;
        Fri, 19 Jul 2024 10:00:00 -0700 (PDT)
X-Google-Smtp-Source: ...
Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])
        by mx.google.com with SMTPS id ...
        for <recipient@example.com>
        (version=TLS1_3 cipher=...);
        Fri, 19 Jul 2024 10:00:00 -0700 (PDT)
Received: by mail-sor-f41.google.com with SMTP id ...;
        Fri, 19 Jul 2024 10:00:00 -0700 (PDT)
...
Received: from 192.168.1.10 (dsl-189-132-1-10.prod-infinitum.com.mx. [189.132.1.10])
        by smtp.gmail.com with ESMTPSA id ...
        for <recipient@example.com>
        (version=TLS1_2 cipher=...);
        Fri, 19 Jul 2024 09:59:59 -0700 (PDT)
From: Attacker <attacker@gmail.com>
To: <recipient@example.com>
Subject: Urgent Request
Date: Fri, 19 Jul 2024 11:59:50 -0500
Message-ID: <...>
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"`;

export function EmailHeaderAnalyzer() {
  const [result, setResult] = useState<EmailHeaderAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headers: defaultHeaders,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await analyzeEmailHeaders(values);
      setResult(response);
    } catch (err) {
      setError('Failed to analyze headers. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <MailSearch className="h-6 w-6" />
          <CardTitle>Email Header Analyzer</CardTitle>
        </div>
        <CardDescription>Paste raw email headers to trace the delivery path and identify the origin.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="headers"
              render={({ field }) => (
                <FormItem>
                  <Label>Raw Email Headers</Label>
                  <FormControl>
                    <Textarea placeholder="Paste full email source/headers here..." {...field} className="font-mono h-48" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Headers
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
          
          {result && (
            <div className="space-y-4">
              <Card className="bg-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{result.summary}</p>
                </CardContent>
              </Card>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  <Route className="h-5 w-5" />
                  Email Path Trace
                </h3>
                <div className="space-y-3">
                  {result.path.map((hop) => (
                    <div key={hop.hop} className="p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold">Hop {hop.hop}</p>
                        <p className="text-xs text-muted-foreground">{hop.timestamp}</p>
                      </div>
                      <div className="text-sm space-y-1 font-mono">
                        <p><strong className="font-sans text-muted-foreground">From:</strong> {hop.from}</p>
                        <p><strong className="font-sans text-muted-foreground">By:</strong> {hop.by}</p>
                        <p><strong className="font-sans text-muted-foreground">With:</strong> {hop.with}</p>
                        <p><strong className="font-sans text-muted-foreground">Delay:</strong> {hop.delay}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
