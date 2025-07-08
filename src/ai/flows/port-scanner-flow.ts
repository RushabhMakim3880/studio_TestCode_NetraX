'use server';
/**
 * @fileOverview An AI flow for simulating a network port scan.
 *
 * - scanPorts - A function that returns a list of open ports for a target.
 * - PortScanInput - The input type for the scanPorts function.
 * - PortScanOutput - The return type for the scanPorts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PortScanInputSchema = z.object({
  target: z.string().describe('The target IP address or domain name to scan.'),
});
export type PortScanInput = z.infer<typeof PortScanInputSchema>;

const PortSchema = z.object({
    port: z.number().int().describe('The port number.'),
    protocol: z.enum(['TCP', 'UDP']).describe('The protocol (TCP or UDP).'),
    state: z.enum(['open', 'closed', 'filtered']).describe('The state of the port.'),
    service: z.string().describe('The common service running on this port (e.g., "http", "ssh", "dns").'),
    version: z.string().optional().describe('A plausible version for the service, if detected.'),
});

const PortScanOutputSchema = z.object({
  results: z.array(PortSchema).describe('A list of scanned ports and their results. Only include a few (3-5) open ports and a few closed/filtered ones for realism.'),
});
export type PortScanOutput = z.infer<typeof PortScanOutputSchema>;

export async function scanPorts(input: PortScanInput): Promise<PortScanOutput> {
  return portScannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'portScannerPrompt',
  input: {schema: PortScanInputSchema},
  output: {schema: PortScanOutputSchema},
  prompt: `You are a network port scanner, like Nmap. Your task is to generate a realistic, simulated port scan result for a given target.

Target: {{{target}}}

Simulate a scan of the top 20 most common TCP ports.
- Identify a few (3-5) ports as 'open' and provide a plausible service and version.
- Identify a few other ports as 'closed' or 'filtered'.
- Common ports: 21 (ftp), 22 (ssh), 23 (telnet), 25 (smtp), 53 (dns), 80 (http), 110 (pop3), 143 (imap), 443 (https), 445 (smb), 3306 (mysql), 3389 (rdp), 5432 (postgresql), 5900 (vnc), 8080 (http-proxy).

The output should be for simulation purposes only.
`,
});

const portScannerFlow = ai.defineFlow(
  {
    name: 'portScannerFlow',
    inputSchema: PortScanInputSchema,
    outputSchema: PortScanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
