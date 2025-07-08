'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { monitorDarkWeb, type DarkWebMonitorOutput } from '@/ai/flows/dark-web-monitor-flow';
import { Loader2, AlertTriangle, Monitor, Sparkles, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';

const formSchema = z.object({
  keywords: z.array(z.string()).min(1, { message: 'Please enter at least one keyword.' }),
});

export function DarkWebMonitor() {
  const [result, setResult] = useState<DarkWebMonitorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKeyword, setCurrentKeyword] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: ['Global-Corp Inc.', 'Project Chimera', 'confidential'],
    },
  });

  const handleAddKeyword = () => {
    const keyword = currentKeyword.trim();
    if (keyword) {
      const currentKeywords = form.getValues('keywords');
      if (!currentKeywords.includes(keyword)) {
        form.setValue('keywords', [...currentKeywords, keyword]);
      }
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    form.setValue(
      'keywords',
      form.getValues('keywords').filter(k => k !== keywordToRemove)
    );
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await monitorDarkWeb(values);
      setResult(response);
    } catch (err) {
      setError('Failed to fetch monitoring results. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Monitor className="h-6 w-6" />
            <CardTitle>Dark Web Monitor</CardTitle>
        </div>
        <CardDescription>Simulate monitoring dark web forums and markets for specific keywords.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label>Monitoring Keywords</Label>
                   <div className="flex items-center gap-2 mt-2">
                        <Input 
                            value={currentKeyword}
                            onChange={(e) => setCurrentKeyword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddKeyword();
                                }
                            }}
                            placeholder="Add a keyword..."
                        />
                        <Button type="button" onClick={handleAddKeyword}>Add</Button>
                   </div>
                   <div className="flex flex-wrap gap-2 mt-2">
                        {form.watch('keywords').map(keyword => (
                            <Badge key={keyword} variant="secondary">
                                {keyword}
                                <button onClick={() => handleRemoveKeyword(keyword)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                   </div>
                   <FormField control={form.control} name="keywords" render={({field}) => (
                      <FormItem><FormMessage className="mt-2"/></FormItem>
                   )}/>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Scan for Mentions
                </Button>
            </form>
            </Form>
            
            <div className="space-y-4">
                <Label>Monitor Feed</Label>
                <div className="h-96 border rounded-md p-4 bg-primary/20 space-y-4 overflow-y-auto">
                    {isLoading && <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                    {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
                    {!isLoading && !result && <div className="text-muted-foreground text-center h-full flex items-center justify-center">Monitoring results will appear here.</div>}
                    
                    {result && result.findings.map((finding, index) => (
                        <div key={index} className="p-3 bg-card rounded-md shadow-sm animate-in fade-in">
                            <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                                <p className="font-semibold">{finding.source}</p>
                                <p>{finding.timestamp}</p>
                            </div>
                            <p className="text-sm">...{finding.snippet}...</p>
                            <Badge variant="outline" className="mt-2">Keyword: {finding.keyword}</Badge>
                        </div>
                    ))}
                     {result && result.findings.length === 0 && <p className="text-muted-foreground text-center pt-8">No mentions found for the given keywords.</p>}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
