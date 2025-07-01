'use server';
/**
 * @fileOverview An AI flow for generating a custom wordlist based on a target's profile.
 *
 * - generateWordlist - A function that returns a list of potential passwords.
 * - WordlistGeneratorInput - The input type for the generateWordlist function.
 * - WordlistGeneratorOutput - The return type for the generateWordlist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const WordlistGeneratorInputSchema = z.object({
  fullName: z.string().describe("The target's full name."),
  role: z.string().describe("The target's job role or title."),
  company: z.string().describe("The target's company."),
  notes: z.string().optional().describe("Additional notes about the target, including hobbies, family names, pet names, important dates, etc."),
});
export type WordlistGeneratorInput = z.infer<typeof WordlistGeneratorInputSchema>;

const WordlistGeneratorOutputSchema = z.object({
  wordlist: z.array(z.string()).describe('A list of 20-30 potential password candidates based on the profile.'),
});
export type WordlistGeneratorOutput = z.infer<typeof WordlistGeneratorOutputSchema>;

export async function generateWordlist(input: WordlistGeneratorInput): Promise<WordlistGeneratorOutput> {
  return wordlistGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'wordlistGeneratorPrompt',
  input: {schema: WordlistGeneratorInputSchema},
  output: {schema: WordlistGeneratorOutputSchema},
  prompt: `You are a password profiling expert, similar to the tool CUpp (Common User Passwords Profiler).
  Your task is to generate a custom wordlist for a specific target based on their personal and professional information.
  Create a list of 20-30 potential passwords.

  The wordlist should include permutations and combinations of the following information:
  - Name and surname
  - Company name
  - Job role
  - Keywords from the notes (hobbies, important dates, pet names, etc.)
  - Common password patterns like adding years (e.g., 2023, 2024), special characters (!, @, #, $), or numbers (123, 1).

  Target Information:
  - Full Name: {{{fullName}}}
  - Role: {{{role}}}
  - Company: {{{company}}}
  - Notes: {{{notes}}}

  Generate a list of realistic and common password formats based on this data. Do not include any explanations.
  `,
});

const wordlistGeneratorFlow = ai.defineFlow(
  {
    name: 'wordlistGeneratorFlow',
    inputSchema: WordlistGeneratorInputSchema,
    outputSchema: WordlistGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
