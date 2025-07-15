
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchBreachCompilation } from '@/services/hibp';
import { Loader2, AlertTriangle, DatabaseZap, ShieldOff, ShieldCheck, Clipboard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

// Infer the response type from the server action to avoid importing non-functions
type BreachCompilationServiceResponse = Awaited<ReturnType<typeof searchBreachCompilation>>;

const formSchema = z.object({
  emailOrUsername: z.string().min(3, { message: 'Please enter a valid email or username.' }),
});

export function BreachDataChecker() {
  const [result, setResult] = useState<BreachCompilationServiceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrUsername: 'test@example.com',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await searchBreachCompilation(values.emailOrUsername);
      setResult(response);
    } catch (err) {
      setResult({ success: false, error: 'An unexpected error occurred.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!' });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <DatabaseZap className="h-6 w-6" />
            <CardTitle>Breach Compilation Checker</CardTitle>
        </div>
        <CardDescription>Check an email or username against a public breach compilation database.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="emailOrUsername"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormLabel>Email or Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., operator@proton.me" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check for Breaches
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            
            {result && !result.success && (
                 <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{result.error}</div>
            )}
            
            {result && result.success && (
                <div>
                    {result.results && result.results.count > 0 ? (
                        <>
                            <div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 mb-4">
                                <ShieldOff className="h-8 w-8" />
                                <div>
                                    <h3 className="font-bold">Credentials Found!</h3>
                                    <p className="text-sm">Found {result.results.count} potential credential pairs in public compilations.</p>
                                </div>
                            </div>
                            <Card>
                                <ScrollArea className="h-72">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Credential Pair</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.results.lines.map((line, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono">{line}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleCopy(line.split(':')[1] || '')}>
                                                        <Clipboard className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </ScrollArea>
                            </Card>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 p-4 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                           <ShieldCheck className="h-8 w-8" />
                            <div>
                               <h3 className="font-bold">Good news — no results found!</h3>
                               <p className="text-sm">This query did not return any results from the breach compilation.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
