'use server';
/**
 * @fileOverview An AI flow for generating simulated cybersecurity law updates.
 *
 * - getLawUpdates - A function that returns a list of recent law updates.
 * - LawUpdateOutput - The return type for the getLawUpdates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LawUpdateSchema = z.object({
  title: z.string().describe('The title of the law or policy update.'),
  summary: z.string().describe('A brief summary of the update and its implications.'),
  jurisdiction: z.string().describe('The jurisdiction (e.g., India, EU, USA).'),
  publishedDate: z.string().describe('The date of the update (YYYY-MM-DD).'),
});

const LawUpdateOutputSchema = z.object({
  updates: z.array(LawUpdateSchema).describe('A list of 3 to 5 recent and relevant cybersecurity law and policy updates.'),
});
export type LawUpdateOutput = z.infer<typeof LawUpdateOutputSchema>;

export async function getLawUpdates(): Promise<LawUpdateOutput> {
  return lawUpdatesFlow();
}

const prompt = ai.definePrompt({
  name: 'lawUpdatesPrompt',
  output: {schema: LawUpdateOutputSchema},
  prompt: `You are a legal analyst specializing in global cybersecurity policy and law.
  Your task is to generate a list of 3 to 5 recent, plausible-sounding (but not necessarily real) cybersecurity law or policy updates.
  Provide a mix of updates from India and other major international jurisdictions (like the EU, USA, etc.).
  The updates should be relevant to a cybersecurity red team operator.
  `,
});

const lawUpdatesFlow = ai.defineFlow(
  {
    name: 'lawUpdatesFlow',
    outputSchema: LawUpdateOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
