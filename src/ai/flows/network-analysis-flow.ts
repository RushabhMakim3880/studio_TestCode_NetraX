'use server';
/**
 * @fileOverview An AI flow for simulating network traffic analysis.
 *
 * - analyzePcap - Generates a simulated analysis report for network traffic.
 * - PcapAnalysisInput - The input type for the analyzePcap function.
 * - PcapAnalysisOutput - The return type for the analyzePcap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const PcapAnalysisInputSchema = z.object({
  fileName: z.string().describe("The name of the PCAP file."),
  description: z.string().describe("A brief description of the network capture's context."),
});
export type PcapAnalysisInput = z.infer<typeof PcapAnalysisInputSchema>;

const DetectedThreatSchema = z.object({
    severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Informational']).describe('The severity of the threat.'),
    type: z.string().describe("The type of threat or anomaly (e.g., 'C2 Beaconing', 'Potential Data Exfiltration', 'Anomalous Protocol Usage')."),
    sourceIp: z.string().ip().describe("The source IP address of the suspicious traffic."),
    destinationIp: z.string().ip().describe("The destination IP address of the suspicious traffic."),
    description: z.string().describe('A clear description of the identified threat and the evidence supporting it.'),
});

const NotableTrafficSchema = z.object({
    timestamp: z.string().describe("Simulated timestamp of the traffic."),
    protocol: z.string().describe("Protocol (e.g., TCP, UDP, HTTP, DNS)."),
    source: z.string().describe("Source IP and port."),
    destination: z.string().describe("Destination IP and port."),
    summary: z.string().describe("A brief summary of the communication."),
});

export const PcapAnalysisOutputSchema = z.object({
  analysisSummary: z.string().describe('A high-level executive summary of the findings from the network traffic analysis.'),
  detectedThreats: z.array(DetectedThreatSchema).describe('A list of security threats or significant anomalies discovered in the traffic.'),
  notableStreams: z.array(NotableTrafficSchema).describe("A list of 5-7 interesting or notable traffic streams for further investigation."),
});
export type PcapAnalysisOutput = z.infer<typeof PcapAnalysisOutputSchema>;

export async function analyzePcap(input: PcapAnalysisInput): Promise<PcapAnalysisOutput> {
  return pcapAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pcapAnalysisPrompt',
  input: {schema: PcapAnalysisInputSchema},
  output: {schema: PcapAnalysisOutputSchema},
  prompt: `You are a senior network forensic analyst.
  Your task is to generate a realistic-looking, simulated analysis report for a network capture file (.pcap).
  The actual file is not provided, only its name and a description of its context.

  PCAP File: {{{fileName}}}
  Context: {{{description}}}

  Based on the context, generate a plausible analysis.
  - Write a high-level summary of the most important findings.
  - Identify a few (1-3) security threats or major anomalies. Invent plausible IP addresses (use private ranges like 192.168.x.x or 10.x.x.x for internal hosts and public IPs for external hosts).
  - For each threat, provide a severity, type, source/destination IPs, and a description.
  - List 5-7 examples of notable traffic streams that would be relevant to the analysis.
  - Make the analysis sound technical and professional.
  
  Do not use real-world private data. The output should be purely for simulation. Do not add conversational text.
  `,
});

const pcapAnalysisFlow = ai.defineFlow(
  {
    name: 'pcapAnalysisFlow',
    inputSchema: PcapAnalysisInputSchema,
    outputSchema: PcapAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
