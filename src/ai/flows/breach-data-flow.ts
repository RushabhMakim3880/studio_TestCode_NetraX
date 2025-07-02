'use server';
/**
 * @fileOverview An AI flow for simulating a search for credentials in data breaches.
 *
 * - searchBreachData - Simulates searching for an email/username in known data breaches.
 * - BreachDataInput - The input type for the searchBreachData function.
 * - BreachDataOutput - The return type for the searchBreachData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BreachDataInputSchema = z.object({
  emailOrUsername: z.string().describe('The email address or username to search for.'),
});
export type BreachDataInput = z.infer<typeof BreachDataInputSchema>;

const BreachSchema = z.object({
  breachName: z.string().describe('The name of the company or service that was breached (e.g., "MyFitnessPal", "LinkedIn").'),
  breachDate: z.string().describe('The approximate date of the breach (e.g., "2018-02-25").'),
  compromisedData: z.array(z.string()).describe('A list of data types that were compromised in this breach for the user (e.g., "Email address", "Password hash", "Username").'),
  description: z.string().describe('A brief description of the breach.'),
});

const BreachDataOutputSchema = z.object({
  breaches: z.array(BreachSchema).describe('A list of 2-5 simulated data breaches where the user\'s data was found.'),
});
export type BreachDataOutput = z.infer<typeof BreachDataOutputSchema>;

export async function searchBreachData(input: BreachDataInput): Promise<BreachDataOutput> {
  return breachDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'breachDataPrompt',
  input: {schema: BreachDataInputSchema},
  output: {schema: BreachDataOutputSchema},
  prompt: `You are a breach data search engine simulator, like "Have I Been Pwned".
Your task is to generate a realistic-looking but simulated list of data breaches for a given email or username.

Search term: {{{emailOrUsername}}}

- Generate a list of 2 to 5 plausible data breaches where this user might have been compromised. Use a mix of well-known historical breach names.
- For each breach, specify the types of data that were compromised.
- Provide a brief description for each breach.
- Decide randomly whether the search term is found in any breaches. If not, return an empty array for the 'breaches' field. Make it find breaches about 80% of the time.

The output should be for simulation purposes only. Do not use real breach data.
`,
});

const breachDataFlow = ai.defineFlow(
  {
    name: 'breachDataFlow',
    inputSchema: BreachDataInputSchema,
    outputSchema: BreachDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
