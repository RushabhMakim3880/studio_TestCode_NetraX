
'use server';
/**
 * @fileOverview An AI flow for generating potential typosquatting and lookalike domains.
 *
 * - generateLookalikeDomains - A function that returns a list of potential phishing domains.
 * - LookalikeDomainInput - The input type for the function.
 * - LookalikeDomainOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LookalikeDomainInputSchema = z.object({
  domain: z.string().describe('The legitimate domain to generate lookalikes for.'),
});
export type LookalikeDomainInput = z.infer<typeof LookalikeDomainInputSchema>;

const LookalikeDomainSchema = z.object({
    domainName: z.string().describe('The generated lookalike domain name.'),
    technique: z.string().describe('The technique used to generate this domain (e.g., "Typosquatting", "Homograph", "Subdomain").'),
});
type LookalikeDomain = z.infer<typeof LookalikeDomainSchema>;

const LookalikeDomainOutputSchema = z.object({
  domains: z.array(LookalikeDomainSchema).describe('A list of 5-10 potential lookalike domains.'),
});
export type LookalikeDomainOutput = z.infer<typeof LookalikeDomainOutputSchema>;

export async function generateLookalikeDomains(input: LookalikeDomainInput): Promise<LookalikeDomainOutput> {
  return domainMonitorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'domainMonitorPrompt',
  input: {schema: LookalikeDomainInputSchema},
  output: {schema: LookalikeDomainOutputSchema},
  prompt: `You are a cybersecurity expert specializing in phishing and brand protection.
Your task is to generate a list of plausible lookalike and typosquatting domains for a given legitimate domain.

Legitimate Domain: {{{domain}}}

Generate a list of 5-10 potential phishing domains using the following techniques:
- Typosquatting: Common misspellings (e.g., 'googgle.com').
- Homograph: Using characters from other languages that look similar (e.g., 'gоogle.com' with a Cyrillic 'о').
- Subdomain: Using the brand name as a subdomain of a malicious domain (e.g., 'google.com.security-update.com').
- Different TLD: Using alternative Top-Level Domains (e.g., 'google.org', 'google.co').
- Insertion: Inserting a small word or hyphen (e.g., 'google-login.com').

For each generated domain, specify the technique used.
`,
});

const domainMonitorFlow = ai.defineFlow(
  {
    name: 'domainMonitorFlow',
    inputSchema: LookalikeDomainInputSchema,
    outputSchema: LookalikeDomainOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
