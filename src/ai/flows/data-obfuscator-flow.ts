
'use server';
/**
 * @fileOverview An AI flow for obfuscating personally identifiable information (PII) in text.
 *
 * - obfuscateText - A function that masks PII in a given text block.
 * - DataObfuscatorInput - The input type for the function.
 * - DataObfuscatorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DataObfuscatorInputSchema = z.object({
  rawText: z.string().min(10).describe('The text containing PII to be obfuscated.'),
});
export type DataObfuscatorInput = z.infer<typeof DataObfuscatorInputSchema>;

const DataObfuscatorOutputSchema = z.object({
  obfuscatedText: z.string().describe('The text with PII masked (e.g., "John Doe" becomes "[NAME]").'),
  summary: z.string().describe('A brief summary of what was obfuscated (e.g., "Masked 2 names and 1 email address.").'),
});
export type DataObfuscatorOutput = z.infer<typeof DataObfuscatorOutputSchema>;

export async function obfuscateText(input: DataObfuscatorInput): Promise<DataObfuscatorOutput> {
  return dataObfuscatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dataObfuscatorPrompt',
  input: {schema: DataObfuscatorInputSchema},
  output: {schema: DataObfuscatorOutputSchema},
  prompt: `You are a data privacy specialist. Your task is to analyze the following text and obfuscate all Personally Identifiable Information (PII).

PII to obfuscate includes:
- Names of people
- Email addresses
- Phone numbers
- Street addresses
- Credit card numbers
- Social Security Numbers or other national IDs

Replace the found PII with a generic, capitalized placeholder, e.g., [NAME], [EMAIL], [PHONE], [ADDRESS].

Raw Text:
\`\`\`
{{{rawText}}}
\`\`\`

After processing, provide the fully obfuscated text and a brief summary of the changes you made.
`,
});

const dataObfuscatorFlow = ai.defineFlow(
  {
    name: 'dataObfuscatorFlow',
    inputSchema: DataObfuscatorInputSchema,
    outputSchema: DataObfuscatorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
