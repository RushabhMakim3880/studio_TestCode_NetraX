
// context-aware-tips.ts
'use server';

/**
 * @fileOverview A context-aware tips and guidance AI agent.
 *
 * - getContextAwareTip - A function that returns a tip based on the user's role and the current module.
 * - ContextAwareTipInput - The input type for the getContextAwareTip function.
 * - ContextAwareTipOutput - The return type for the getContextAwareTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextAwareTipInputSchema = z.object({
  userRole: z
    .string()
    .describe("The user's role (Admin, Analyst, Operator, or Auditor)."),
  currentModule: z.string().describe('The name of the module currently in use.'),
});
export type ContextAwareTipInput = z.infer<typeof ContextAwareTipInputSchema>;

const ContextAwareTipOutputSchema = z.object({
  tip: z.string().describe('A helpful tip tailored to the user role and module.'),
});
export type ContextAwareTipOutput = z.infer<typeof ContextAwareTipOutputSchema>;

export async function getContextAwareTip(input: ContextAwareTipInput): Promise<ContextAwareTipOutput> {
  return contextAwareTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextAwareTipPrompt',
  input: {schema: ContextAwareTipInputSchema},
  output: {schema: ContextAwareTipOutputSchema},
  prompt: `You are a cybersecurity expert providing helpful tips to users of the NETRA-X application.

  The user has the role of {{{userRole}}} and is currently using the {{{currentModule}}} module.

  Provide a single, concise tip that is relevant to their role and the module they are using.
  The tip should be no more than one sentence long.
  Do not include any introductory or concluding remarks.
  The tip should be professional and helpful.
  `,
});

const contextAwareTipFlow = ai.defineFlow(
  {
    name: 'contextAwareTipFlow',
    inputSchema: ContextAwareTipInputSchema,
    outputSchema: ContextAwareTipOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (error) {
      console.error(`[contextAwareTipFlow] Failed to generate tip for role ${input.userRole} in module ${input.currentModule}:`, error);
      // Return a generic, safe fallback tip if the AI call fails.
      // This makes the UI more resilient to backend model outages.
      return {
        tip: `Remember to save your work frequently when using the ${input.currentModule} module.`
      };
    }
  }
);
