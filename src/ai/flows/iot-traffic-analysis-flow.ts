'use server';
/**
 * @fileOverview An AI flow for simulating IoT wireless traffic analysis.
 *
 * - analyzeIotTraffic - A function that returns a simulated analysis report.
 * - IotTrafficAnalysisInput - The input type for the function.
 * - IotTrafficAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IotTrafficAnalysisInputSchema = z.object({
  fileName: z.string().describe("The name of the capture file."),
  protocol: z.enum(['Zigbee', 'BLE', 'WiFi', 'RF']).describe('The wireless protocol.'),
  context: z.string().describe("A brief description of the capture's context."),
});
export type IotTrafficAnalysisInput = z.infer<typeof IotTrafficAnalysisInputSchema>;

const TrafficEventSchema = z.object({
    timestamp: z.string().describe('A simulated timestamp for the event.'),
    sourceDevice: z.string().describe('A plausible identifier for the source device (e.g., MAC address, device name).'),
    destinationDevice: z.string().describe('A plausible identifier for the destination device.'),
    summary: z.string().describe('A summary of the event.'),
    isSuspicious: z.boolean().describe('Whether this event is considered suspicious or anomalous.'),
});

const IotTrafficAnalysisOutputSchema = z.object({
  analysisSummary: z.string().describe('A high-level summary of the traffic analysis, noting any major security concerns.'),
  events: z.array(TrafficEventSchema).describe('A list of 5-7 notable traffic events observed in the capture.'),
});
export type IotTrafficAnalysisOutput = z.infer<typeof IotTrafficAnalysisOutputSchema>;

export async function analyzeIotTraffic(input: IotTrafficAnalysisInput): Promise<IotTrafficAnalysisOutput> {
  return iotTrafficAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'iotTrafficAnalysisPrompt',
  input: {schema: IotTrafficAnalysisInputSchema},
  output: {schema: IotTrafficAnalysisOutputSchema},
  prompt: `You are an expert in IoT wireless security, specializing in analyzing protocols like Zigbee, BLE, WiFi, and general RF traffic.
Your task is to generate a realistic-looking, simulated analysis report for a wireless traffic capture.

Protocol: {{{protocol}}}
Capture File: {{{fileName}}}
Context: {{{context}}}

Based on the protocol and context, generate a plausible analysis.
- Write a high-level summary of the findings, highlighting any security risks discovered.
- Generate a list of 5-7 notable traffic events.
- For each event, generate a plausible timestamp, source/destination device identifiers, and a summary of what happened.
- Flag some events as suspicious, for example:
    - (BLE) Unencrypted transmission of sensitive data.
    - (Zigbee) Device joining network with a default, well-known key.
    - (WiFi) Deauthentication flood attack detected.
    - (RF) Replay attack detected on 433MHz frequency.
    - (WiFi) Rogue AP or "Evil Twin" detected with a similar SSID.
    - (BLE) Repeated connection requests indicating a potential denial-of-service attempt.
    - (Zigbee) Replay of an older command.
    - (RF) Unexplained high-power signal suggesting jamming.

Make the analysis sound technical and professional. The output should be purely for simulation.
`,
});

const iotTrafficAnalysisFlow = ai.defineFlow(
  {
    name: 'iotTrafficAnalysisFlow',
    inputSchema: IotTrafficAnalysisInputSchema,
    outputSchema: IotTrafficAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
