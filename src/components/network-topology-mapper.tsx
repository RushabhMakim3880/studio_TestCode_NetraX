'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateNetworkTopology, type NetworkTopologyOutput } from '@/ai/flows/network-topology-flow';
import { Loader2, AlertTriangle, Map, Server, Laptop, Router, Printer, Shield, HelpCircle, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  context: z.string().min(10, { message: 'Context must be at least 10 characters.' }),
});

const getNodeIcon = (type: string) => {
    switch(type) {
        case 'workstation': return <Laptop className="h-8 w-8 text-sky-400" />;
        case 'server': return <Server className="h-8 w-8 text-amber-400" />;
        case 'router': return <Router className="h-8 w-8 text-indigo-400" />;
        case 'printer': return <Printer className="h-8 w-8 text-slate-400" />;
        case 'firewall': return <Shield className="h-8 w-8 text-destructive" />;
        default: return <HelpCircle className="h-8 w-8 text-muted-foreground" />;
    }
}

export function NetworkTopologyMapper() {
  const [result, setResult] = useState<NetworkTopologyOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: "A small office network with a few workstations, a file server, and a connection to the internet.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await generateNetworkTopology(values);
      setResult(response);
    } catch (err) {
      setError('Failed to generate network map. The simulation may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Map className="h-6 w-6" />
                <CardTitle>AI Network Topology Mapper</CardTitle>
            </div>
            <CardDescription>Provide context about a network to generate a simulated topology map.</CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                   <FormField
                    control={form.control}
                    name="context"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network Context</FormLabel>
                        <FormControl>
                            <Textarea placeholder="e.g., 'Internal finance department VLAN...'" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Map
                  </Button>
                </form>
            </Form>

            <div className="mt-6">
                {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
                
                {result && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Discovered Nodes</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {result.nodes.map(node => (
                                    <Card key={node.id} className="p-4">
                                        <div className="flex items-start gap-4">
                                            {getNodeIcon(node.type)}
                                            <div>
                                                <p className="font-bold">{node.hostname}</p>
                                                <p className="text-sm font-mono text-muted-foreground">{node.id}</p>
                                                <p className="text-xs text-muted-foreground">{node.os}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Observed Connections</h3>
                            <div className="space-y-2">
                                {result.links.length > 0 ? result.links.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-primary/20 text-sm">
                                        <span className="font-mono text-muted-foreground">{link.source}</span>
                                        <ArrowRight className="h-4 w-4 text-accent" />
                                        <span className="font-mono text-muted-foreground">{link.target}</span>
                                        <span className="text-foreground ml-auto pl-2 border-l border-border/50">{link.description}</span>
                                    </div>
                                )) : <p className="text-center text-muted-foreground py-4">No specific connections were mapped.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </CardContent>
    </Card>
  );
}
