'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateSummaryReport, type ReportingOutput } from '@/ai/flows/reporting-flow';
import { Loader2, AlertTriangle, Calendar as CalendarIcon, FileText, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  reportType: z.string().min(1, { message: 'Please select a report type.' }),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

const reportTypes = ['Phishing Campaign Results', 'Quarterly Vulnerability Summary', 'OSINT Activity Overview'];

export default function ReportingPage() {
  const [result, setResult] = useState<ReportingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const handleDownloadPdf = async () => {
    if (!reportCardRef.current || !result) return;
    setIsDownloadingPdf(true);

    try {
      const canvas = await html2canvas(reportCardRef.current, {
          scale: 2, // Higher scale for better quality
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
          orientation: 'p',
          unit: 'px',
          format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const safeTitle = result.title.replace(/\s+/g, '_').toLowerCase();
      pdf.save(`report-${safeTitle}.pdf`);
      
      toast({
          title: "Download Started",
          description: "Your PDF report is being downloaded."
      });

    } catch (error) {
        console.error("Failed to generate PDF", error);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "There was an error creating the PDF report."
        });
    } finally {
        setIsDownloadingPdf(false);
    }
  };

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
        <Card ref={reportCardRef}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6" />
                <CardTitle>{result.title}</CardTitle>
              </div>
              <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
              >
                  {isDownloadingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                      <Download className="mr-2 h-4 w-4"/>
                  )}
                  Download PDF
              </Button>
            </div>
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
                     <h3 className="font-semibold mb-2">{result.chartTitle}</h3>
                     <ChartContainer config={{}} className="h-[200px] w-full">
                        <BarChart data={result.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
