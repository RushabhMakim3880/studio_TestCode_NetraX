
'use server';
/**
 * @fileOverview An AI flow for generating DuckyScript payloads.
 *
 * - generateDuckyScript - Generates a script based on a natural language prompt.
 * - DuckyScriptGeneratorInput - The input type for the function.
 * - DuckyScriptGeneratorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DuckyScriptGeneratorInputSchema = z.object({
  prompt: z.string().describe('A natural language description of the desired payload actions.'),
});
export type DuckyScriptGeneratorInput = z.infer<typeof DuckyScriptGeneratorInputSchema>;

const DuckyScriptGeneratorOutputSchema = z.object({
  script: z.string().describe('The generated DuckyScript payload.'),
});
export type DuckyScriptGeneratorOutput = z.infer<typeof DuckyScriptGeneratorOutputSchema>;

export async function generateDuckyScript(input: DuckyScriptGeneratorInput): Promise<DuckyScriptGeneratorOutput> {
  return duckyScriptGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'duckyScriptGeneratorPrompt',
  input: {schema: DuckyScriptGeneratorInputSchema},
  output: {schema: DuckyScriptGeneratorOutputSchema},
  prompt: `You are an expert in creating USB Rubber Ducky scripts (DuckyScript).
Your task is to convert a natural language prompt into a valid DuckyScript payload.

The script should be efficient and follow DuckyScript 2.0 syntax.
- Use 'DELAY' to pause execution.
- Use 'STRING' to type text.
- Use 'ENTER' to press the Enter key.
- Use 'GUI r' to open the Run dialog.
- Use 'CTRL-SHIFT-ESCAPE' to open Task Manager.
- Use 'ALT F4' to close a window.
- Understand multi-stage commands, like opening PowerShell, downloading a file with Invoke-WebRequest, and then executing it.
- Your output must be only the DuckyScript code, with no explanations, markdown formatting, or conversational text.

Prompt: {{{prompt}}}

Generate only the DuckyScript code.
`,
});

const duckyScriptGeneratorFlow = ai.defineFlow(
  {
    name: 'duckyScriptGeneratorFlow',
    inputSchema: DuckyScriptGeneratorInputSchema,
    outputSchema: DuckyScriptGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
