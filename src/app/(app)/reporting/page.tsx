'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, subDays, addDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateSummaryReport, type ReportingOutput } from '@/ai/flows/reporting-flow';
import { Loader2, AlertTriangle, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from '@/components/ui/chart';

const formSchema = z.object({
  reportType: z.string().min(1, { message: 'Please select a report type.' }),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

const reportTypes = ['Phishing Campaign Results', 'Quarterly Vulnerability Summary', 'OSINT Activity Overview'];
const chartData = [
  { name: 'Week 1', value: Math.floor(Math.random() * 500) + 100 },
  { name: 'Week 2', value: Math.floor(Math.random() * 500) + 100 },
  { name: 'Week 3', value: Math.floor(Math.random() * 500) + 100 },
  { name: 'Week 4', value: Math.floor(Math.random() * 500) + 100 },
];

export default function ReportingPage() {
  const [result, setResult] = useState<ReportingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportType: 'Phishing Campaign Results',
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateSummaryReport({
        reportType: values.reportType,
        startDate: format(values.dateRange.from, 'yyyy-MM-dd'),
        endDate: format(values.dateRange.to, 'yyyy-MM-dd'),
      });
      setResult(response);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Reporting & Analytics</h1>
        <p className="text-muted-foreground">Generate and view operational reports.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
          <CardDescription>Select parameters to generate a new report.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a report type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reportTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Range</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn('justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>{format(field.value.from, 'LLL dd, y')} - {format(field.value.to, 'LLL dd, y')}</>
                              ) : (
                                format(field.value.from, 'LLL dd, y')
                              )
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={field.value}
                            onSelect={field.onChange as (range: DateRange | undefined) => void}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && <Card className="border-destructive/50"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Error</CardTitle></div></CardHeader><CardContent><p>{error}</p></CardContent></Card>}
      
      {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3"><FileText className="h-6 w-6" /><CardTitle>{result.title}</CardTitle></div>
            <CardDescription>Report for period: {format(form.getValues('dateRange.from'), 'LLL dd, y')} - {format(form.getValues('dateRange.to'), 'LLL dd, y')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {result.keyMetrics.map(metric => (
                <Card key={metric.metric}>
                  <CardHeader className="pb-2">
                    <CardDescription>{metric.metric}</CardDescription>
                    <CardTitle className="text-3xl">{metric.value}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-xs text-muted-foreground">{metric.change} from last period</p></CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid md:grid-cols-5 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <h3 className="font-semibold">Executive Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>
                <div className="md:col-span-3">
                     <h3 className="font-semibold mb-2">Activity Volume</h3>
                     <ChartContainer config={{}} className="h-[200px] w-full">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8}/>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="value" fill="var(--color-accent)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
