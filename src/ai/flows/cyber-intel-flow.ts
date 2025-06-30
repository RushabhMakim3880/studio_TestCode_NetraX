'use server';
/**
 * @fileOverview An AI flow for generating cyber threat intelligence.
 *
 * - getThreatIntel - A function that returns a threat brief on a topic.
 * - ThreatIntelInput - The input type for the getThreatIntel function.
 * - ThreatIntelOutput - The return type for the getThreatIntel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ThreatIntelInputSchema = z.object({
  topic: z.string().describe('The cybersecurity topic to generate a brief on (e.g., a CVE, a threat actor, a malware family).'),
});
export type ThreatIntelInput = z.infer<typeof ThreatIntelInputSchema>;

const ThreatIntelOutputSchema = z.object({
  brief: z.string().describe('A concise threat intelligence brief on the topic.'),
  affectedSystems: z.array(z.string()).describe('A list of systems or software potentially affected.'),
  recommendations: z.array(z.string()).describe('A list of recommended mitigation actions.'),
});
export type ThreatIntelOutput = z.infer<typeof ThreatIntelOutputSchema>;

export async function getThreatIntel(input: ThreatIntelInput): Promise<ThreatIntelOutput> {
  return cyberIntelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cyberIntelPrompt',
  input: {schema: ThreatIntelInputSchema},
  output: {schema: ThreatIntelOutputSchema},
  prompt: `You are a senior cyber threat intelligence analyst for a government agency.
  Your task is to provide a clear, concise, and actionable threat brief based on the provided topic.

  Topic: {{{topic}}}

  Generate a brief that includes:
  1.  A summary of the threat.
  2.  A list of potentially affected systems or software.
  3.  A list of concrete, actionable recommendations for mitigation.

  The tone should be professional and authoritative. Do not include any preamble or conversational text.
  `,
});

const cyberIntelFlow = ai.defineFlow(
  {
    name: 'cyberIntelFlow',
    inputSchema: ThreatIntelInputSchema,
    outputSchema: ThreatIntelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
