'use server';
/**
 * @fileOverview An AI flow for simulating dark web monitoring.
 *
 * - monitorDarkWeb - Generates a list of simulated findings for given keywords.
 * - DarkWebMonitorInput - The input type for the function.
 * - DarkWebMonitorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DarkWebMonitorInputSchema = z.object({
  keywords: z.array(z.string()).min(1).describe('An array of keywords to monitor on the dark web.'),
});
export type DarkWebMonitorInput = z.infer<typeof DarkWebMonitorInputSchema>;

const FindingSchema = z.object({
  timestamp: z.string().describe('A recent, relative timestamp for the finding (e.g., "1 hour ago").'),
  source: z.string().describe("The name of the simulated dark web forum or marketplace where the finding occurred (e.g., 'Dread', 'BreachForums', 'AlphaBay')."),
  snippet: z.string().describe('A short, realistic snippet of text showing the keyword in context.'),
  keyword: z.string().describe('The specific keyword that was matched.'),
});

const DarkWebMonitorOutputSchema = z.object({
  findings: z.array(FindingSchema).describe('A list of 5-7 plausible but fake dark web findings related to the keywords.'),
});
export type DarkWebMonitorOutput = z.infer<typeof DarkWebMonitorOutputSchema>;

export async function monitorDarkWeb(input: DarkWebMonitorInput): Promise<DarkWebMonitorOutput> {
  return darkWebMonitorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'darkWebMonitorPrompt',
  input: {schema: DarkWebMonitorInputSchema},
  output: {schema: DarkWebMonitorOutputSchema},
  prompt: `You are a dark web monitoring service simulator. Your task is to generate a list of 5 to 7 recent, realistic-looking findings based on a list of keywords.

The findings should appear to be from well-known (or plausible) dark web forums or marketplaces.
Each finding must include a recent timestamp, a source, the matched keyword, and a text snippet.
The snippets should be concise and sound authentic to the dark web context (e.g., discussions about data leaks, selling of credentials, chatter about a company).

Keywords to monitor: {{#each keywords}}"{{{this}}}"{{#unless @last}}, {{/unless}}{{/each}}

Do not use real data or generate any illegal content. This is strictly for a security simulation.
`,
});

const darkWebMonitorFlow = ai.defineFlow(
  {
    name: 'darkWebMonitorFlow',
    inputSchema: DarkWebMonitorInputSchema,
    outputSchema: DarkWebMonitorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
