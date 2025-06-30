'use server';
/**
 * @fileOverview An AI flow for generating OSINT reports.
 *
 * - gatherOsint - Generates a simulated OSINT report for a domain.
 * - OsintInput - The input type for the gatherOsint function.
 * - OsintOutput - The return type for the gatherOsint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OsintInputSchema = z.object({
  domain: z.string().describe('The target domain name for OSINT gathering.'),
});
export type OsintInput = z.infer<typeof OsintInputSchema>;

const OsintOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the OSINT findings.'),
  discoveredEmails: z.array(z.string()).describe('A list of plausible, but fake, email addresses discovered.'),
  subdomains: z.array(z.string()).describe('A list of plausible, but fake, subdomains discovered.'),
  socialMediaProfiles: z.array(z.string()).describe('A list of plausible, but fake, social media profile URLs.'),
});
export type OsintOutput = z.infer<typeof OsintOutputSchema>;

export async function gatherOsint(input: OsintInput): Promise<OsintOutput> {
  return osintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'osintPrompt',
  input: {schema: OsintInputSchema},
  output: {schema: OsintOutputSchema},
  prompt: `You are an OSINT (Open-Source Intelligence) aggregation tool.
  Your task is to generate a simulated but realistic-looking OSINT report for a given domain.

  Target Domain: {{{domain}}}

  Generate a report containing:
  1.  A brief summary of the domain's likely purpose and online footprint.
  2.  A list of 3-5 plausible (but not real) email addresses associated with the domain.
  3.  A list of 3-5 plausible (but not real) subdomains.
  4.  A list of 2-3 plausible (but not real) social media profile URLs (e.g., LinkedIn, Twitter) related to the domain or company.

  Do not use real data. The output should be purely for simulation. Do not add conversational text.
  `,
});

const osintFlow = ai.defineFlow(
  {
    name: 'osintFlow',
    inputSchema: OsintInputSchema,
    outputSchema: OsintOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
