'use server';
/**
 * @fileOverview An AI flow for simulating offensive security tools.
 *
 * - runOffensiveTool - A function that simulates the output of a security tool.
 * - OffensiveToolInput - The input type for the runOffensiveTool function.
 * - OffensiveToolOutput - The return type for the runOffensiveTool function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OffensiveToolInputSchema = z.object({
  tool: z.string().describe("The tool to simulate (e.g., 'Nmap', 'Metasploit')."),
  target: z.string().describe('The target for the tool (e.g., an IP address, a domain).'),
});
export type OffensiveToolInput = z.infer<typeof OffensiveToolInputSchema>;

const OffensiveToolOutputSchema = z.object({
  log: z.string().describe('The simulated output log from the tool.'),
});
export type OffensiveToolOutput = z.infer<typeof OffensiveToolOutputSchema>;

export async function runOffensiveTool(input: OffensiveToolInput): Promise<OffensiveToolOutput> {
  return offensiveToolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'offensiveToolPrompt',
  input: {schema: OffensiveToolInputSchema},
  output: {schema: OffensiveToolOutputSchema},
  prompt: `You are a command-line penetration testing tool.
  Your purpose is to generate a realistic-looking, simulated output log for running a specific tool against a target.

  Tool: {{{tool}}}
  Target: {{{target}}}

  Generate a plausible output that an operator would expect to see.
  - If the tool is Nmap, show open ports, services, and versions.
  - If the tool is Metasploit, show a simulated exploit session.
  - If the tool is a directory buster (like gobuster), show discovered paths.

  The output should be formatted as a raw text log, enclosed in a code block if appropriate for the tool. Do not add any conversational text or explanations.
  `,
});

const offensiveToolFlow = ai.defineFlow(
  {
    name: 'offensiveToolFlow',
    inputSchema: OffensiveToolInputSchema,
    outputSchema: OffensiveToolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
