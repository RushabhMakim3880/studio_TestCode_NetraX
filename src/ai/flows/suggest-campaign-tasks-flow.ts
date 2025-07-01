'use server';
/**
 * @fileOverview An AI flow for suggesting tasks for a new red team campaign.
 *
 * - suggestCampaignTasks - A function that suggests tasks for a campaign.
 * - CampaignTasksSuggesterInput - The input type for the function.
 * - CampaignTasksSuggesterOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CampaignTasksSuggesterInputSchema = z.object({
  campaignName: z.string().describe('The name of the red team campaign.'),
  campaignTarget: z.string().describe('The target of the campaign (e.g., a company, sector).'),
});
export type CampaignTasksSuggesterInput = z.infer<typeof CampaignTasksSuggesterInputSchema>;

const TaskSchema = z.object({
    description: z.string().describe('A concise description of the task to be performed.'),
    type: z.enum(['Recon', 'Phishing', 'Payload', 'Post-Exploitation', 'General']).describe('The category or phase of the task.'),
});

const CampaignTasksSuggesterOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of 5-8 suggested tasks for the campaign, covering different phases.'),
});
export type CampaignTasksSuggesterOutput = z.infer<typeof CampaignTasksSuggesterOutputSchema>;

export async function suggestCampaignTasks(input: CampaignTasksSuggesterInput): Promise<CampaignTasksSuggesterOutput> {
  return campaignTasksSuggesterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'campaignTasksSuggesterPrompt',
  input: {schema: CampaignTasksSuggesterInputSchema},
  output: {schema: CampaignTasksSuggesterOutputSchema},
  prompt: `You are a senior red team operations planner.
  Your task is to create a list of initial tasks for a new campaign based on its name and target.

  Campaign Name: {{{campaignName}}}
  Target: {{{campaignTarget}}}

  Generate a list of 5 to 8 plausible and logical tasks for the initial phase of this campaign.
  The tasks should cover different types: Reconnaissance, Phishing, Payload development, etc.
  Make the descriptions clear and actionable.
  For example, for a campaign against a bank, a 'Recon' task could be "Identify public-facing web applications and employee profiles on LinkedIn."
  A 'Phishing' task could be "Develop a phishing lure based on internal IT support notifications."
  `,
});

const campaignTasksSuggesterFlow = ai.defineFlow(
  {
    name: 'campaignTasksSuggesterFlow',
    inputSchema: CampaignTasksSuggesterInputSchema,
    outputSchema: CampaignTasksSuggesterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
