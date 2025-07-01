'use server';
/**
 * @fileOverview An AI flow for simulating the results of a phishing campaign.
 *
 * - simulatePhishingCampaign - A function that returns a simulated event timeline.
 * - PhishingSimulationInput - The input for the function.
 * - PhishingSimulationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PhishingSimulationInputSchema = z.object({
  targetCount: z.number().int().positive().describe('The number of targets in the campaign.'),
  scenario: z.string().describe('A brief description of the phishing scenario (e.g., "Urgent invoice payment", "IT password reset").'),
  targetProfiles: z.array(z.string()).describe('A list of the names of the target profiles.'),
});
export type PhishingSimulationInput = z.infer<typeof PhishingSimulationInputSchema>;


const SimulationEventSchema = z.object({
    timestamp: z.string().describe('The simulated timestamp of the event, relative to the campaign start (e.g., "T+0s", "T+1m 30s", "T+2h 15m").'),
    type: z.enum(['SENT', 'OPENED', 'CLICKED', 'COMPROMISED']).describe('The type of event.'),
    target: z.string().describe('The name of the target involved in the event.'),
    detail: z.string().describe('A short detail about the event.'),
});

const PhishingSimulationOutputSchema = z.object({
  events: z.array(SimulationEventSchema).describe('A timeline of simulated events for the phishing campaign. Generate a realistic sequence of events over time.'),
});
export type PhishingSimulationOutput = z.infer<typeof PhishingSimulationOutputSchema>;

export async function simulatePhishingCampaign(input: PhishingSimulationInput): Promise<PhishingSimulationOutput> {
  return phishingSimulationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'phishingSimulationPrompt',
  input: {schema: PhishingSimulationInputSchema},
  output: {schema: PhishingSimulationOutputSchema},
  prompt: `You are a phishing campaign simulator. Your task is to generate a realistic sequence of events for a simulated phishing attack.

Campaign Details:
- Scenario: {{{scenario}}}
- Number of Targets: {{{targetCount}}}
- Target Names: {{#each targetProfiles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Generate a timeline of events.
- All targets should have a 'SENT' event at the beginning (T+0s).
- A plausible percentage of targets should 'OPEN' the email over a period of minutes to hours.
- A smaller percentage should 'CLICK' the link.
- An even smaller percentage should be 'COMPROMISED' (i.e., submitted credentials).
- The events should be chronologically ordered by their relative timestamp.
- Make the details interesting, for example, "Email opened on mobile device" or "Clicked link from corporate network".
- Generate between 10 and 20 total events, depending on the number of targets.
`,
});

const phishingSimulationFlow = ai.defineFlow(
  {
    name: 'phishingSimulationFlow',
    inputSchema: PhishingSimulationInputSchema,
    outputSchema: PhishingSimulationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
