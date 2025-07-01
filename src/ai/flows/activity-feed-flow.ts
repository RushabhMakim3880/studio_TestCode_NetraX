'use server';
/**
 * @fileOverview An AI flow for generating a simulated user activity feed.
 *
 * - getActivityFeed - A function that returns a list of recent user activities.
 * - ActivityFeedOutput - The return type for the getActivityFeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivitySchema = z.object({
  timestamp: z.string().describe('The timestamp of the activity in a readable format (e.g., "2 minutes ago", "1 hour ago").'),
  user: z.string().describe('The username of the user who performed the action (e.g., "operator", "analyst").'),
  action: z.string().describe('A short description of the action performed (e.g., "Generated Phishing Email", "Scanned File Hash").'),
  details: z.string().describe('Specific details about the action (e.g., "Scenario: Urgent invoice payment", "Hash: e88219c...").'),
});

const ActivityFeedOutputSchema = z.object({
  activities: z.array(ActivitySchema).describe('A list of 5-7 recent and plausible user activities within the NETRA-X platform.'),
});
export type ActivityFeedOutput = z.infer<typeof ActivityFeedOutputSchema>;

export async function getActivityFeed(): Promise<ActivityFeedOutput> {
  return activityFeedFlow();
}

const prompt = ai.definePrompt({
  name: 'activityFeedPrompt',
  output: {schema: ActivityFeedOutputSchema},
  prompt: `You are an activity log simulator for a cybersecurity platform called NETRA-X.
  Your task is to generate a list of 5 to 7 recent, realistic-sounding user activities.
  The platform has users with roles like 'admin', 'analyst', and 'operator'.
  The platform has modules for OSINT, Phishing, Malware Analysis, VAPT, Reporting, and Offensive Tools.

  Generate a mix of activities from different users and modules. Make the timestamps relative and recent (e.g., "just now", "5 minutes ago", "2 hours ago").
  The details should be specific and plausible for the action.
  `,
});

const activityFeedFlow = ai.defineFlow(
  {
    name: 'activityFeedFlow',
    outputSchema: ActivityFeedOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
