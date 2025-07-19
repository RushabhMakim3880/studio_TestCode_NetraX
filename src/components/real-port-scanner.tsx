
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scanPorts, type PortScanResult, type ScanPortsOptions } from '@/actions/scan-ports-action';
import { Loader2, AlertTriangle, ShieldCheck, Binary, Info, Code, Checkbox } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const formSchema = z.object({
  target: z.string().min(3, { message: 'Please enter a valid target.' }),
  scanType: z.enum(['TCP', 'SYN']),
  ports: z.string().optional(),
  serviceDetection: z.boolean().default(false),
  osDetection: z.boolean().default(false),
});

const getStatusColor = (state: string): 'destructive' | 'secondary' | 'default' | 'outline' => {
  if (state === 'open') return 'destructive';
  if (state === 'closed') return 'secondary';
  if (state === 'filtered') return 'outline';
  return 'default';
};

const nmapApiScript = `
# nmap_api.py - A simple Flask wrapper for Nmap
# To run: pip install flask python-nmap
#         python nmap_api.py

from flask import Flask, request, jsonify
import nmap
import sys

app = Flask(__name__)
nm = nmap.PortScanner()

@app.route('/scan', methods=['POST'])
def scan():
    data = request.json
    target = data.get('target')
    scan_type = data.get('scan_type', 'TCP')
    ports = data.get('ports') # e.g., '22,80,443'
    service_detection = data.get('service_detection', False)
    os_detection = data.get('os_detection', False)

    if not target:
        return jsonify({'error': 'Target is required'}), 400

    try:
        arguments = '-T4' # Aggressive timing template
        if scan_type == 'SYN':
            # Note: SYN scan requires root/admin privileges
            arguments += ' -sS'
        
        if service_detection:
            arguments += ' -sV'
        
        if os_detection:
            # Note: OS detection requires root/admin privileges
            arguments += ' -O'

        print(f"Running nmap with arguments: '{arguments}' on {target}:{ports or 'default'}", file=sys.stderr)
        
        nm.scan(target, ports, arguments=arguments)
        
        results = []
        if target in nm.all_hosts():
            host_info = nm[target]
            # OS detection results
            os_match = host_info.get('osmatch', [])
            
            # Port results
            for proto in host_info.all_protocols():
                lport = host_info[proto].keys()
                for port in lport:
                    port_info = host_info[proto][port]
                    results.append({
                        'port': port,
                        'state': port_info.get('state'),
                        'name': port_info.get('name'),
                        'product': port_info.get('product'),
                        'version': port_info.get('version'),
                        'extrainfo': port_info.get('extrainfo'),
                    })
            return jsonify({'ports': results, 'os': os_match})
        else:
            return jsonify({'error': 'Host not found or not scanned.'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Listens on all interfaces on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
`;

export function RealPortScanner() {
  const [results, setResults] = useState<PortScanResult[]>([]);
  const [osResults, setOsResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target: 'scanme.nmap.org',
      scanType: 'TCP',
      ports: '21,22,23,25,80,443,3389,8080',
      serviceDetection: true,
      osDetection: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults([]);
    setOsResults([]);
    setError(null);
    
    try {
      const response = await scanPorts(values);
      if(response.error) {
          setError(response.error);
      } else {
          setResults(response.ports || []);
          setOsResults(response.os || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during the scan.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Binary className="h-6 w-6" />
            <CardTitle>Advanced Network Scanner</CardTitle>
        </div>
        <CardDescription>Perform live port scans with service and OS detection using a local Nmap wrapper.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full mb-6">
          <AccordionItem value="setup-guide">
            <AccordionTrigger>
                <div className="flex items-center gap-2 text-amber-400">
                    <Info className="h-4 w-4" />
                    Important: Setup Guide for Advanced Scans
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">For advanced scans (SYN, OS Detection), this tool acts as a frontend for Nmap running on your local machine. You must run the provided Python script to handle the scans.</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>Ensure you have Python3 and Nmap installed on your system.</li>
                    <li>Install required Python libraries: <code className="bg-primary/20 p-1 rounded-sm">pip install flask python-nmap</code></li>
                    <li>Save the script below as <code className="bg-primary/20 p-1 rounded-sm">nmap_api.py</code> and run it from your terminal: <code className="bg-primary/20 p-1 rounded-sm">python nmap_api.py</code></li>
                    <li>For SYN scans or OS Detection, you may need to run the script with <code className="bg-primary/20 p-1 rounded-sm">sudo</code>.</li>
                </ol>
                <h4 className="font-semibold">Nmap API Script:</h4>
                <pre className="bg-primary/20 p-4 rounded-md text-sm overflow-x-auto"><code>{nmapApiScript}</code></pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              <FormField control={form.control} name="target" render={({ field }) => ( <FormItem><FormLabel>Target IP or Domain</FormLabel><FormControl><Input placeholder="e.g., scanme.nmap.org" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="ports" render={({ field }) => ( <FormItem><FormLabel>Ports</FormLabel><FormControl><Input placeholder="e.g., 22,80,1-1000 (blank=default)" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="scanType" render={({ field }) => ( <FormItem><FormLabel>Scan Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="TCP">TCP Connect</SelectItem><SelectItem value="SYN">SYN Stealth (Requires Nmap API)</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
            </div>
             <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                <FormField control={form.control} name="serviceDetection" render={({ field }) => ( <FormItem className="flex items-center gap-2 space-y-0"> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="serviceDetection"/> <Label htmlFor="serviceDetection" className="font-normal">Service & Version Detection</Label> </FormItem> )}/>
                <FormField control={form.control} name="osDetection" render={({ field }) => ( <FormItem className="flex items-center gap-2 space-y-0"> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="osDetection"/> <Label htmlFor="osDetection" className="font-normal">OS Detection (Requires Nmap API)</Label> </FormItem> )}/>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scan Network
            </Button>
          </form>
        </Form>
        <div className="mt-6">
            {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
            
            {(!isLoading && !error) && (results.length > 0 || osResults.length > 0) && (
              <div className="space-y-6">
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Open Ports for {form.getValues('target')}</h3>
                    <div className="border rounded-md max-h-80 overflow-y-auto">
                        <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                            <TableRow>
                                <TableHead>Port</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Version</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.filter(p => p.state === 'open').map((portInfo) => (
                                <TableRow key={portInfo.port}>
                                    <TableCell className="font-mono">{portInfo.port}</TableCell>
                                    <TableCell><Badge variant={getStatusColor(portInfo.state)} className="capitalize">{portInfo.state}</Badge></TableCell>
                                    <TableCell>{portInfo.name}</TableCell>
                                    <TableCell>{portInfo.product} {portInfo.version}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                </div>
                 {osResults.length > 0 && (
                    <div>
                         <h3 className="text-lg font-semibold mb-2">OS Detection</h3>
                         {osResults.map((os, index) => (
                             <div key={index} className="text-sm p-2 bg-primary/20 rounded-md">
                                 <p><strong>OS Guess:</strong> {os.name} ({os.accuracy}% confidence)</p>
                             </div>
                         ))}
                    </div>
                 )}
              </div>
            )}

             {!isLoading && !error && results.length === 0 && osResults.length === 0 && form.formState.isSubmitted && (
                <div className="text-center text-muted-foreground py-10">
                    <p>Scan complete. No results to display.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
