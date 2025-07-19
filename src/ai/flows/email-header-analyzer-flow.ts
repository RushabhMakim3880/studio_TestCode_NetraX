
'use server';
/**
 * @fileOverview An AI flow for analyzing email headers to trace their path.
 *
 * - analyzeEmailHeaders - A function that returns a trace of an email's path.
 * - EmailHeaderAnalysisInput - The input type for the function.
 * - EmailHeaderAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmailHeaderAnalysisInputSchema = z.object({
  headers: z.string().min(50).describe('The full, raw email headers.'),
});
export type EmailHeaderAnalysisInput = z.infer<typeof EmailHeaderAnalysisInputSchema>;

const HeaderHopSchema = z.object({
    hop: z.number().describe('The hop number, starting from the final destination (1).'),
    from: z.string().describe('The server the email was received from.'),
    by: z.string().describe('The server that received the email.'),
    with: z.string().describe('The protocol used (e.g., ESMTP, SMTP).'),
    timestamp: z.string().describe('The timestamp of this hop.'),
    delay: z.string().describe('The delay between this hop and the previous one.'),
});

const EmailHeaderAnalysisOutputSchema = z.object({
  path: z.array(HeaderHopSchema).describe('The traced path of the email, from destination to origin.'),
  summary: z.string().describe('A brief, high-level summary of the analysis, pointing out the likely originating IP and any suspicious delays or servers.'),
});
export type EmailHeaderAnalysisOutput = z.infer<typeof EmailHeaderAnalysisOutputSchema>;

export async function analyzeEmailHeaders(input: EmailHeaderAnalysisInput): Promise<EmailHeaderAnalysisOutput> {
  return emailHeaderAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emailHeaderAnalysisPrompt',
  input: {schema: EmailHeaderAnalysisInputSchema},
  output: {schema: EmailHeaderAnalysisOutputSchema},
  prompt: `You are a network forensics expert specializing in email analysis.
  Your task is to analyze the provided raw email headers and trace the path of the email from its final destination back to its origin.

  Email Headers:
  \`\`\`
  {{{headers}}}
  \`\`\`

  - Parse each "Received:" header to create a hop in the path.
  - The first "Received:" header is the final destination (hop 1). The last "Received:" header is the origin.
  - For each hop, extract the 'from', 'by', 'with' (protocol), and timestamp information.
  - Calculate the delay between each hop.
  - Provide a final summary identifying the likely originating IP address and highlighting any unusual or suspicious parts of the path (e.g., long delays, servers in unexpected locations).
  `,
});

const emailHeaderAnalysisFlow = ai.defineFlow(
  {
    name: 'emailHeaderAnalysisFlow',
    inputSchema: EmailHeaderAnalysisInputSchema,
    outputSchema: EmailHeaderAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
