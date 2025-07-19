'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { crawlSiteForGraph, type CrawlResult } from '@/actions/crawl-action';
import { Loader2, AlertTriangle, GitFork } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';

const formSchema = z.object({
  domain: z.string().min(3, { message: 'Please enter a valid domain name.' }),
});

const CustomNode = (props: any) => {
  const { x, y, width, height, index, payload } = props;
  const isRoot = payload.name === 'root';
  let fill;
  if (payload.type === 'API') fill = 'hsl(var(--destructive))';
  else if (payload.type === 'Login') fill = 'hsl(var(--chart-4))';
  else if (payload.type === 'External') fill = 'hsl(var(--chart-2))';
  else fill = 'hsl(var(--chart-1))';

  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity="1"
        radius={[2, 2, 2, 2]}
      />
      <text
        textAnchor="middle"
        x={x + width / 2}
        y={y + height / 2}
        dy="0.355em"
        fill="hsl(var(--primary-foreground))"
        className="text-xs font-semibold"
      >
        {payload.name}
      </text>
    </Layer>
  );
};


export function AttackSurfaceVisualizer() {
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: 'google.com',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await crawlSiteForGraph(values.domain);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormLabel>Target Domain</FormLabel>
                  <FormControl><Input placeholder="e.g., example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto mt-2 md:mt-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Visualize Surface
            </Button>
          </form>
        </Form>
      </CardHeader>
      <CardContent className="h-[70vh] w-full">
        {isLoading && <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>}
        {error && <div className="flex h-full items-center justify-center text-destructive gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
        {!isLoading && !result && !error && (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <GitFork className="h-16 w-16 mb-4" />
                <p>Enter a domain and click "Visualize" to see the attack surface graph.</p>
            </div>
        )}
        {result && (
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={result}
              node={<CustomNode />}
              nodePadding={50}
              margin={{
                left: 100,
                right: 100,
                top: 5,
                bottom: 5,
              }}
              link={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
            >
              <Tooltip />
            </Sankey>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
