'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzeIotTraffic, IotTrafficAnalysisOutput, IotTrafficAnalysisInputSchema } from '@/ai/flows/iot-traffic-analysis-flow';
import { Loader2, AlertTriangle, Wifi, ShieldAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function IotTrafficAnalyzer() {
  const [result, setResult] = useState<IotTrafficAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof IotTrafficAnalysisInputSchema>>({
    resolver: zodResolver(IotTrafficAnalysisInputSchema),
    defaultValues: {
      fileName: '',
      protocol: 'BLE',
      context: "Traffic captured between a smart lock and a mobile app during pairing and unlocking.",
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('fileName', file.name);
    }
  };

  async function onSubmit(values: z.infer<typeof IotTrafficAnalysisInputSchema>) {
    if (!values.fileName) {
        form.setError('fileName', { message: 'Please select a capture file.' });
        return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await analyzeIotTraffic(values);
      setResult(response);
    } catch (err) {
      setError('Failed to analyze traffic. The simulation may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wifi className="h-6 w-6" />
          <CardTitle>IoT Wireless Traffic Analyzer</CardTitle>
        </div>
        <CardDescription>Simulate analyzing a wireless traffic capture (e.g., Zigbee, BLE). The file is not uploaded.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="fileName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Capture File</FormLabel>
                        <FormControl>
                            <Input 
                                type="file"
                                accept=".pcap,.pcapng,.cap"
                                onChange={handleFileChange}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="protocol"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Protocol</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select protocol..." /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Zigbee">Zigbee</SelectItem>
                                <SelectItem value="BLE">Bluetooth Low Energy (BLE)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
             <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capture Context</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Describe the capture scenario..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Traffic
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
          
          {result && (
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Analysis Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.analysisSummary}</p>
                </div>
                
                <div>
                    <h3 className="font-semibold text-lg mb-2">Notable Events</h3>
                    <div className="border rounded-md">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Summary</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.events.map((event, index) => (
                            <TableRow key={index} className={event.isSuspicious ? 'bg-destructive/10' : ''}>
                                <TableCell className="font-mono text-xs">{event.timestamp}</TableCell>
                                <TableCell className="font-mono text-xs">{event.sourceDevice}</TableCell>
                                <TableCell className="font-mono text-xs">{event.destinationDevice}</TableCell>
                                <TableCell className="text-sm">
                                    {event.isSuspicious && <ShieldAlert className="h-4 w-4 text-destructive inline-block mr-2" />}
                                    {event.summary}
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
