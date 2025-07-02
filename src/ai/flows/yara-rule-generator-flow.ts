'use server';
/**
 * @fileOverview An AI flow for generating Yara rules from natural language.
 *
 * - generateYaraRule - Generates a Yara rule based on a description.
 * - YaraRuleGeneratorInput - The input type for the function.
 * - YaraRuleGeneratorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const YaraRuleGeneratorInputSchema = z.object({
  description: z.string().min(10).describe('A natural language description of the malware\'s characteristics or behavior.'),
});
export type YaraRuleGeneratorInput = z.infer<typeof YaraRuleGeneratorInputSchema>;

const YaraRuleGeneratorOutputSchema = z.object({
  rule: z.string().describe('The generated Yara rule.'),
});
export type YaraRuleGeneratorOutput = z.infer<typeof YaraRuleGeneratorOutputSchema>;

export async function generateYaraRule(input: YaraRuleGeneratorInput): Promise<YaraRuleGeneratorOutput> {
  return yaraRuleGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'yaraRuleGeneratorPrompt',
  input: {schema: YaraRuleGeneratorInputSchema},
  output: {schema: YaraRuleGeneratorOutputSchema},
  prompt: `You are an expert cybersecurity analyst specializing in creating Yara rules for malware detection.
Your task is to convert a natural language description of a malware's characteristics into a valid and effective Yara rule.

Description of Malware:
"{{{description}}}"

Based on the description, generate a complete Yara rule. The rule should include:
- A unique and descriptive rule name.
- A meta section with author, date, and a reference/description.
- A strings section with plausible hex strings, wide/ascii strings based on the description.
- A condition section.

Generate only the Yara rule code. Do not include any explanations, markdown formatting, or conversational text.
`,
});

const yaraRuleGeneratorFlow = ai.defineFlow(
  {
    name: 'yaraRuleGeneratorFlow',
    inputSchema: YaraRuleGeneratorInputSchema,
    outputSchema: YaraRuleGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
