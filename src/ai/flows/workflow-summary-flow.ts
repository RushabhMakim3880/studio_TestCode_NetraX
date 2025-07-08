'use server';
/**
 * @fileOverview An AI flow for summarizing a series of user actions into a coherent workflow guide.
 *
 * - generateWorkflowSummary - Generates a title and summary for a list of step descriptions.
 * - WorkflowSummaryInput - The input type for the function.
 * - WorkflowSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkflowSummaryInputSchema = z.object({
  stepDescriptions: z.array(z.string()).describe('An ordered list of descriptions for each step in a workflow.'),
});
export type WorkflowSummaryInput = z.infer<typeof WorkflowSummaryInputSchema>;

const WorkflowSummaryOutputSchema = z.object({
  title: z.string().describe('A concise and descriptive title for the entire workflow guide.'),
  summary: z.string().describe('A one-paragraph summary that explains the purpose and flow of the steps taken.'),
});
export type WorkflowSummaryOutput = z.infer<typeof WorkflowSummaryOutputSchema>;

export async function generateWorkflowSummary(input: WorkflowSummaryInput): Promise<WorkflowSummaryOutput> {
  return workflowSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workflowSummaryPrompt',
  input: {schema: WorkflowSummaryInputSchema},
  output: {schema: WorkflowSummaryOutputSchema},
  prompt: `You are a technical writer tasked with creating a guide from a series of actions performed by a user.
The user has provided a list of descriptions for each step they took.
Your task is to analyze these steps and generate a clear, concise title and a summary paragraph for the entire workflow.

The steps are as follows:
{{#each stepDescriptions}}
- {{{this}}}
{{/each}}

Based on this sequence, generate a suitable title and a summary that would be helpful at the beginning of a PDF guide containing screenshots of these actions.
`,
});

const workflowSummaryFlow = ai.defineFlow(
  {
    name: 'workflowSummaryFlow',
    inputSchema: WorkflowSummaryInputSchema,
    outputSchema: WorkflowSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
