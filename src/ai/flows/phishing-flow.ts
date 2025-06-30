'use server';
/**
 * @fileOverview An AI flow for generating phishing simulation content.
 *
 * - generatePhishingEmail - Generates a phishing email subject and body.
 * - PhishingInput - The input type for the generatePhishingEmail function.
 * - PhishingOutput - The return type for the generatePhishingEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PhishingInputSchema = z.object({
  company: z.string().describe('The target company or organization.'),
  role: z.string().describe("The target employee's role (e.g., 'Accountant', 'Developer')."),
  scenario: z.string().describe("The phishing scenario (e.g., 'urgent invoice payment', 'IT password reset')."),
});
export type PhishingInput = z.infer<typeof PhishingInputSchema>;

const PhishingOutputSchema = z.object({
  subject: z.string().describe('The generated subject line for the phishing email.'),
  body: z.string().describe('The generated body content for the phishing email. Should be in HTML format.'),
});
export type PhishingOutput = z.infer<typeof PhishingOutputSchema>;

export async function generatePhishingEmail(input: PhishingInput): Promise<PhishingOutput> {
  return phishingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'phishingPrompt',
  input: {schema: PhishingInputSchema},
  output: {schema: PhishingOutputSchema},
  prompt: `You are a red team operator specializing in social engineering.
  Your task is to craft a highly convincing phishing email for a simulation exercise.

  Target Company: {{{company}}}
  Target Role: {{{role}}}
  Scenario: {{{scenario}}}

  Generate a compelling email subject and an HTML body. The email should be designed to entice the user to click a link or open an attachment.
  Make it look realistic. Use HTML for formatting, including paragraphs, bold text, and a fake link. The link's href should be '#' and it should look like a button or a plausible URL.
  Do not include any real malicious content. Do not include any explanations.
  `,
});

const phishingFlow = ai.defineFlow(
  {
    name: 'phishingFlow',
    inputSchema: PhishingInputSchema,
    outputSchema: PhishingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
