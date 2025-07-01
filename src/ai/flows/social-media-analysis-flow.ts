'use server';
/**
 * @fileOverview An AI flow for simulating social media profile analysis.
 *
 * - analyzeSocialMediaProfile - Generates a simulated analysis of a social media profile.
 * - SocialMediaAnalysisInput - The input type for the function.
 * - SocialMediaAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialMediaAnalysisInputSchema = z.object({
  profileUrl: z.string().url().describe('The URL of the social media profile to analyze.'),
});
export type SocialMediaAnalysisInput = z.infer<typeof SocialMediaAnalysisInputSchema>;

const SocialMediaAnalysisOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the profile and its owner.'),
  interests: z.array(z.string()).describe('A list of detected hobbies and interests.'),
  sentiment: z.string().describe('The general sentiment or tone of the user (e.g., "Professional and formal", "Casual and humorous", "Highly political").'),
  potentialVulnerabilities: z.array(z.string()).describe('A list of potential social engineering angles or vulnerabilities based on the profile.'),
});
export type SocialMediaAnalysisOutput = z.infer<typeof SocialMediaAnalysisOutputSchema>;

export async function analyzeSocialMediaProfile(input: SocialMediaAnalysisInput): Promise<SocialMediaAnalysisOutput> {
  return socialMediaAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'socialMediaAnalysisPrompt',
  input: {schema: SocialMediaAnalysisInputSchema},
  output: {schema: SocialMediaAnalysisOutputSchema},
  prompt: `You are a social media intelligence (SOCMINT) analyst working for a red team.
  Your task is to analyze a social media profile and generate a simulated intelligence report.

  Profile URL (for context, do not attempt to access): {{{profileUrl}}}

  Based on the URL (e.g., LinkedIn, Twitter/X, Facebook), generate a plausible analysis of the kind of person who might have this profile.
  - Summarize the person's likely professional and personal life.
  - List their likely interests and hobbies.
  - Describe their general sentiment or tone.
  - Most importantly, identify 2-3 potential social engineering vulnerabilities or angles that could be used in a phishing or pretexting campaign. For example, "Target is a dog lover, could be targeted with pet-related charity scams" or "Frequently posts about job dissatisfaction, making them susceptible to recruiter lures."

  Do not use real data. The output should be purely for simulation. Do not add conversational text.
  `,
});

const socialMediaAnalysisFlow = ai.defineFlow(
  {
    name: 'socialMediaAnalysisFlow',
    inputSchema: SocialMediaAnalysisInputSchema,
    outputSchema: SocialMediaAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
