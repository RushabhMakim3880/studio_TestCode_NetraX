'use server';
/**
 * @fileOverview An AI flow for simulating a VirusTotal hash scan.
 *
 * - scanFileHash - Generates a simulated VirusTotal report for a file hash.
 * - VirusTotalScanInput - The input type for the scanFileHash function.
 * - VirusTotalScanOutput - The return type for the scanFileHash function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VirusTotalScanInputSchema = z.object({
  hash: z.string().min(32).describe('The file hash (MD5, SHA1, or SHA256) to scan.'),
});
export type VirusTotalScanInput = z.infer<typeof VirusTotalScanInputSchema>;

const ScanResultSchema = z.object({
    engineName: z.string().describe("The name of the antivirus engine."),
    category: z.enum(['malicious', 'suspicious', 'undetected', 'timeout']).describe("The detection category."),
    result: z.string().nullable().describe("The name of the detected threat, if any."),
});

const VirusTotalScanOutputSchema = z.object({
  scanDate: z.string().describe("The simulated date of the scan in ISO 8601 format."),
  positives: z.number().int().describe("The number of engines that detected the hash as malicious."),
  total: z.number().int().describe("The total number of engines that scanned the hash."),
  results: z.array(ScanResultSchema).describe("A list of simulated scan results from various engines."),
});
export type VirusTotalScanOutput = z.infer<typeof VirusTotalScanOutputSchema>;

export async function scanFileHash(input: VirusTotalScanInput): Promise<VirusTotalScanOutput> {
  return virusTotalScanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'virusTotalScanPrompt',
  input: {schema: VirusTotalScanInputSchema},
  output: {schema: VirusTotalScanOutputSchema},
  prompt: `You are a VirusTotal API simulator. Your task is to generate a realistic-looking, simulated scan report for a given file hash.

  File Hash: {{{hash}}}

  - Based on the hash (even though it's just a string), decide if it should be detected as malicious, suspicious, or clean. Generate a plausible number of positive detections.
  - The total number of engines should be between 60 and 75.
  - Generate a list of 10-15 scan results from well-known antivirus engines (e.g., BitDefender, Kaspersky, McAfee, Symantec, Malwarebytes, Microsoft).
  - For positive results, provide a realistic-looking threat name (e.g., "Gen:Variant.Adware.Gael," "Trojan.Win32.Generic!BT").
  - For other results, the category should be 'undetected' and the result field should be null.
  - Generate a recent scan date.
  - The output should be purely for simulation. Do not use real data. Do not add conversational text.
  `,
});

const virusTotalScanFlow = ai.defineFlow(
  {
    name: 'virusTotalScanFlow',
    inputSchema: VirusTotalScanInputSchema,
    outputSchema: VirusTotalScanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
