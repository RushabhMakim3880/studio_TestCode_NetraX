'use server';
/**
 * @fileOverview An AI flow for simulating brand abuse and copyright infringement monitoring.
 *
 * - monitorBrandAbuse - Generates a report on potential brand abuse.
 * - BrandAbuseInput - The input type for the function.
 * - BrandAbuseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BrandAbuseInputSchema = z.object({
  brandName: z.string().describe('The brand name to monitor (e.g., "Global-Corp").'),
  domain: z.string().describe('The primary domain of the brand (e.g., "global-corp.com").'),
});
export type BrandAbuseInput = z.infer<typeof BrandAbuseInputSchema>;

const SocialMentionSchema = z.object({
    platform: z.string().describe("The platform where the mention was found (e.g., 'Twitter/X', 'Reddit')."),
    author: z.string().describe("The author of the mention."),
    snippet: z.string().describe("A short snippet of the mention."),
    url: z.string().url().describe("A fake URL to the mention."),
});

const CopyrightInfringementSchema = z.object({
    site: z.string().url().describe("The URL of the infringing site."),
    description: z.string().describe("A description of the infringement (e.g., 'Unauthorized use of official logo on landing page.')."),
});

const BrandAbuseOutputSchema = z.object({
  suspectedPhishingUrls: z.array(z.string().url()).describe('A list of 2-4 plausible but fake URLs that appear to be phishing sites targeting the brand.'),
  typosquattedDomains: z.array(z.string()).describe('A list of 3-5 plausible but fake typosquatted or look-alike domains.'),
  socialMediaMentions: z.array(SocialMentionSchema).describe('A list of 2-3 simulated social media mentions that could be relevant for brand protection.'),
  copyrightInfringements: z.array(CopyrightInfringementSchema).describe('A list of 1-2 simulated copyright infringements.'),
});
export type BrandAbuseOutput = z.infer<typeof BrandAbuseOutputSchema>;

export async function monitorBrandAbuse(input: BrandAbuseInput): Promise<BrandAbuseOutput> {
  return brandAbuseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'brandAbusePrompt',
  input: {schema: BrandAbuseInputSchema},
  output: {schema: BrandAbuseOutputSchema},
  prompt: `You are a brand protection analyst for a service like Proofpoint. Your task is to generate a simulated report of potential brand abuse on the internet for a given brand.

Brand Name: {{{brandName}}}
Primary Domain: {{{domain}}}

Generate a plausible report containing the following sections:
1.  **suspectedPhishingUrls**: Create a list of 2-4 fake but realistic URLs that are likely phishing sites. These should use variations of the brand name and common phishing TLDs (e.g., .net, .xyz, .info).
2.  **typosquattedDomains**: Create a list of 3-5 plausible but fake typosquatted domains. Use common techniques like character omission, repetition, or different TLDs.
3.  **socialMediaMentions**: Create 2-3 fake but realistic social media mentions (from places like Twitter/X or Reddit) that could be impersonation attempts or negative sentiment that a brand would want to track.
4.  **copyrightInfringements**: Create 1-2 fake but realistic examples of copyright infringement, like a third-party site using the official logo without permission.

The output must be for simulation purposes only. Do not use real data.
`,
});

const brandAbuseFlow = ai.defineFlow(
  {
    name: 'brandAbuseFlow',
    inputSchema: BrandAbuseInputSchema,
    outputSchema: BrandAbuseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
