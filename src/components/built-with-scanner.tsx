'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getTechStack, type BuiltWithOutput } from '@/ai/flows/built-with-flow';
import { Loader2, AlertTriangle, Layers } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
});

export function BuiltWithScanner() {
  const [result, setResult] = useState<BuiltWithOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: 'https://react.dev/',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await getTechStack(values);
      setResult(response);
    } catch (err) {
      setError('Failed to fetch technology stack. The AI may have refused the request.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Layers className="h-6 w-6" />
            <CardTitle>Technology Profiler</CardTitle>
        </div>
        <CardDescription>Identify the technology stack of a given website (simulation).</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Technologies
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {result && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Detected Technologies ({result.technologies.length} found)</h3>
                    <div className="border rounded-md">
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Technology</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Version</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.technologies.map((tech, index) => (
                                <TableRow key={index}>
                                <TableCell className="font-semibold">{tech.name}</TableCell>
                                <TableCell><Badge variant="outline">{tech.category}</Badge></TableCell>
                                <TableCell>{tech.version || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
