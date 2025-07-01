'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { runOffensiveTool, type OffensiveToolOutput } from '@/ai/flows/offensive-tool-flow';
import { Loader2, AlertTriangle, Terminal } from 'lucide-react';
import { RubberDuckyEditor } from '@/components/rubber-ducky-editor';

const formSchema = z.object({
  tool: z.string().min(1, { message: 'Please select a tool.' }),
  target: z.string().min(7, { message: 'Please enter a valid target (IP or domain).' }),
});

const availableTools = ['Nmap Scan', 'Gobuster Scan', 'Metasploit Exploit'];

export default function OffensivePage() {
  const [result, setResult] = useState<OffensiveToolOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tool: 'Nmap Scan',
      target: '192.168.1.101',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await runOffensiveTool(values);
      setResult(response);
    } catch (err) {
      setError('Failed to run the tool. The simulation may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Offensive Toolkit</h1>
        <p className="text-muted-foreground">Deploy simulated offensive cyber capabilities.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tool Launcher</CardTitle>
          <CardDescription>Select a tool, define a target, and run the simulation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tool</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tool" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTools.map((tool) => (
                            <SelectItem key={tool} value={tool}>
                              {tool}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10.0.0.5 or target.local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Tool
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

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

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Terminal className="h-6 w-6" />
              <CardTitle>Tool Output</CardTitle>
            </div>
            <CardDescription>Simulated log from {form.getValues('tool')} against {form.getValues('target')}.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-primary/20 p-4 rounded-md text-sm text-foreground overflow-x-auto font-mono">
              <code>{result.log}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      <RubberDuckyEditor />
    </div>
  );
}
