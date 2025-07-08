
'use server';
/**
 * @fileOverview An AI flow for generating strategic red team campaign plans.
 *
 * - generateCampaignPlan - A function that generates a campaign plan based on an objective.
 * - CampaignPlannerInput - The input type for the function.
 * - CampaignPlannerOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CampaignPlannerInputSchema = z.object({
  objective: z.string().describe('The ultimate goal of the campaign (e.g., "Exfiltrate user database", "Gain domain admin access").'),
  targetDescription: z.string().describe('A description of the target organization or system.'),
});
export type CampaignPlannerInput = z.infer<typeof CampaignPlannerInputSchema>;

const PlanStepSchema = z.object({
    action: z.string().describe('The specific action to take.'),
    tool: z.string().describe('The NETRA-X tool to use for this action (e.g., "OSINT Investigator", "Phishing Simulator", "Payload Generator", "C2 Panel").'),
    justification: z.string().describe('A brief justification for why this step is important for the campaign.'),
});

const PlanPhaseSchema = z.object({
    phaseName: z.string().describe('The name of the campaign phase based on the Cyber Kill Chain or MITRE ATT&CK (e.g., "Reconnaissance", "Weaponization", "Initial Access", "Command & Control").'),
    steps: z.array(PlanStepSchema).describe('A list of 2-3 steps for this phase.'),
});

const CampaignPlannerOutputSchema = z.object({
    planTitle: z.string().describe('A suitable title for the generated campaign plan.'),
    executiveSummary: z.string().describe('A high-level, one-paragraph summary of the overall strategy.'),
    phases: z.array(PlanPhaseSchema).describe('A list of phases that make up the campaign plan.'),
});
export type CampaignPlannerOutput = z.infer<typeof CampaignPlannerOutputSchema>;

export async function generateCampaignPlan(input: CampaignPlannerInput): Promise<CampaignPlannerOutput> {
  return campaignPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'campaignPlannerPrompt',
  input: {schema: CampaignPlannerInputSchema},
  output: {schema: CampaignPlannerOutputSchema},
  prompt: `You are a master red team strategist. Your task is to create a detailed, phased campaign plan based on a given objective and target.
The plan should be structured into logical phases (like Reconnaissance, Weaponization, Delivery, Exploitation, C2).
For each phase, outline a few concrete steps. For each step, specify the action, the recommended NETRA-X tool to use, and a brief justification.

Available NETRA-X Tools:
- Cyber Intel
- OSINT Investigator
- Profiling
- Phishing
- Templates
- Offensive Tools (contains Payload Generator, Password Cracker, Exploit Suggester, etc.)
- C2 Panel
- Campaigns
- VAPT & Compliance
- Malware Analysis
- Network Analysis
- Reporting
- File Manager

Target Description: {{{targetDescription}}}
Campaign Objective: {{{objective}}}

Generate a comprehensive but high-level plan.
`,
});

const campaignPlannerFlow = ai.defineFlow(
  {
    name: 'campaignPlannerFlow',
    inputSchema: CampaignPlannerInputSchema,
    outputSchema: CampaignPlannerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    