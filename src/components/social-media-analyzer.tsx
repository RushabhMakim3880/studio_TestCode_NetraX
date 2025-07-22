
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { analyzeSocialMediaProfile, type SocialMediaAnalysisOutput } from '@/ai/flows/social-media-analysis-flow';
import { Loader2, AlertTriangle, Users, Heart, ShieldAlert } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  profileUrl: z.string().url({ message: 'Please enter a valid URL.' }),
});

export function SocialMediaAnalyzer() {
  const [result, setResult] = useState<SocialMediaAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileUrl: 'https://www.linkedin.com/in/john-doe-12345',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await analyzeSocialMediaProfile(values);
      setResult(response);
    } catch (err) {
      setError('Failed to analyze profile. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Profile Analyzer</CardTitle>
        <CardDescription>Enter a social media profile URL to generate a simulated personality and vulnerability analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="profileUrl"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormLabel>Profile URL</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., https://www.linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Profile
            </Button>
          </form>
        </Form>
        
        {error && <div className="mt-4 text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
        
        {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {result && (
          <div className="mt-6 space-y-6">
            <Separator />
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <Users className="h-5 w-5" />
                Profile Summary
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{result.summary}</p>
              <p className="mt-2">
                <Badge variant="secondary">{result.sentiment}</Badge>
              </p>
            </div>
             <div className="grid md:grid-cols-2 gap-6">
               <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-red-400" />
                    Interests
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {result.interests.map((interest, i) => <li key={i}>{interest}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <ShieldAlert className="h-5 w-5 text-amber-400" />
                    Potential Angles
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {result.potentialVulnerabilities.map((vuln, i) => <li key={i}>{vuln}</li>)}
                  </ul>
                </div>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

