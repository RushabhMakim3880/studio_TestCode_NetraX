
'use server';
/**
 * @fileOverview An AI flow for generating a high-level OSINT summary for a company.
 *
 * - generateOsintSummary - A function that returns a brief summary of a target.
 * - OsintSummaryInput - The input type for the function.
 * - OsintSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OsintSummaryInputSchema = z.object({
  targetName: z.string().describe('The name of the target company or organization.'),
});
export type OsintSummaryInput = z.infer<typeof OsintSummaryInputSchema>;

const OsintSummaryOutputSchema = z.object({
  website: z.string().describe('The most likely primary domain for the company.'),
  techStack: z.array(z.string()).describe('A plausible list of 3-4 technologies the company might use (e.g., "AWS", "Salesforce", "React").'),
  keyPersonnel: z.array(z.string()).describe('A list of 2-3 plausible key personnel roles (e.g., "CEO", "CISO", "Head of IT").'),
});
export type OsintSummaryOutput = z.infer<typeof OsintSummaryOutputSchema>;

export async function generateOsintSummary(input: OsintSummaryInput): Promise<OsintSummaryOutput> {
  return osintSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'osintSummaryPrompt',
  input: {schema: OsintSummaryInputSchema},
  output: {schema: OsintSummaryOutputSchema},
  prompt: `You are an OSINT analyst. Based on the target company name provided, generate a plausible, high-level intelligence summary.
This is for a simulation, so you should invent realistic details.

Target: {{{targetName}}}

Provide the following:
1. A likely primary domain name.
2. A list of 3-4 technologies they might use.
3. A list of 2-3 key personnel roles.

Do not include any conversational text.
`,
});

const osintSummaryFlow = ai.defineFlow(
  {
    name: 'osintSummaryFlow',
    inputSchema: OsintSummaryInputSchema,
    outputSchema: OsintSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
