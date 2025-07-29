
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Server, Globe, Users } from 'lucide-react';
import { generateOsintSummary, type OsintSummaryOutput } from '@/ai/flows/osint-summary-flow';

const formSchema = z.object({
  targetName: z.string().min(3, 'Please enter a target name.'),
});

export function AutomatedOsintSummary() {
  const [result, setResult] = useState<OsintSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { targetName: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateOsintSummary({ targetName: values.targetName });
      setResult(response);
    } catch (e) {
      setError("Failed to generate OSINT summary.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <Sparkles />
          AI OSINT Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
          <Input {...form.register('targetName')} placeholder="Enter target company name..." />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
          </Button>
        </form>

        <div className="mt-4 min-h-[150px]">
          {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
          {error && <p className="text-destructive text-sm">{error}</p>}
          
          {result && (
            <div className="space-y-3 text-sm animate-in fade-in">
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-accent"/> <strong>Website:</strong> <a href={`https://${result.website}`} target="_blank" className="underline">{result.website}</a></div>
              <div className="flex items-center gap-2"><Server className="h-4 w-4 text-accent"/> <strong>Tech Stack:</strong> {result.techStack.join(', ')}</div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-accent"/> <strong>Key Personnel:</strong> {result.keyPersonnel.join(', ')}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
