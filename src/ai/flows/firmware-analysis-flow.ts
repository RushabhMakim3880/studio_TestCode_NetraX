
'use server';
/**
 * @fileOverview An AI flow for simulating firmware analysis for IoT devices.
 *
 * - analyzeFirmware - A function that returns a simulated analysis report.
 * - FirmwareAnalysisInput - The input type for the function.
 * - FirmwareAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FirmwareAnalysisInputSchema = z.object({
  fileName: z.string().describe("The name of the firmware file."),
  deviceDescription: z.string().describe("A brief description of the IoT device."),
});
export type FirmwareAnalysisInput = z.infer<typeof FirmwareAnalysisInputSchema>;

const FindingSchema = z.object({
    severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Informational']).describe('The severity of the finding.'),
    type: z.string().describe("The type of vulnerability (e.g., 'Hardcoded Secret', 'Outdated Library', 'Insecure Function Usage')."),
    description: z.string().describe('A clear description of the identified weakness.'),
    recommendation: z.string().describe('A specific recommendation on how to remediate the issue.'),
});

const FirmwareAnalysisOutputSchema = z.object({
  summary: z.string().describe('A high-level executive summary of the firmware analysis findings.'),
  findings: z.array(FindingSchema).describe('A list of security findings discovered in the firmware.'),
});
export type FirmwareAnalysisOutput = z.infer<typeof FirmwareAnalysisOutputSchema>;

export async function analyzeFirmware(input: FirmwareAnalysisInput): Promise<FirmwareAnalysisOutput> {
  return firmwareAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'firmwareAnalysisPrompt',
  input: {schema: FirmwareAnalysisInputSchema},
  output: {schema: FirmwareAnalysisOutputSchema},
  prompt: `You are a senior IoT security researcher specializing in firmware reverse engineering.
Your task is to generate a realistic-looking, simulated analysis report for a given firmware file.

Firmware File: {{{fileName}}}
Device Description: {{{deviceDescription}}}

Based on the device type, generate a plausible analysis.
- Write a high-level summary of the most important findings.
- Identify 3-5 security weaknesses. For each finding, provide a severity, type, description, and recommendation.
- Common findings include:
    - Hardcoded credentials (passwords, API keys)
    - Use of old, vulnerable libraries (e.g., busybox 1.2, openssl 1.0.1)
    - Unsigned firmware update mechanisms
    - Embedded private keys
    - Insecure functions like strcpy, gets
    - Hardcoded C2 server URLs or IPs

Make the analysis sound technical and professional. The output should be purely for simulation.
`,
});

const firmwareAnalysisFlow = ai.defineFlow(
  {
    name: 'firmwareAnalysisFlow',
    inputSchema: FirmwareAnalysisInputSchema,
    outputSchema: FirmwareAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
