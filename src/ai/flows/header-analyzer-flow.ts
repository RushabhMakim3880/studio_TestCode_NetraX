
'use server';
/**
 * @fileOverview An AI flow for analyzing HTTP security headers for vulnerabilities.
 *
 * - analyzeHeaders - A function that analyzes headers for misconfigurations.
 * - HeaderAnalyzerInput - The input type for the function.
 * - HeaderAnalyzerOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HeaderAnalyzerInputSchema = z.object({
  headers: z.string().min(20).describe('A string containing multiple HTTP security headers (e.g., Content-Security-Policy, X-Frame-Options).'),
});
export type HeaderAnalyzerInput = z.infer<typeof HeaderAnalyzerInputSchema>;

const FindingSchema = z.object({
    header: z.string().describe('The specific header with the issue (e.g., "Content-Security-Policy").'),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Informational']).describe('The severity of the finding.'),
    description: z.string().describe('A clear description of the identified weakness or misconfiguration.'),
    recommendation: z.string().describe('A specific recommendation on how to remediate the issue.'),
});

const ExploitPayloadSchema = z.object({
    type: z.string().describe('The type of bypass or exploit (e.g., "CSP Bypass", "Clickjacking PoC").'),
    payload: z.string().describe('The code or payload for the exploit.'),
    explanation: z.string().describe('A brief explanation of how the payload works to bypass the misconfiguration.'),
});

const HeaderAnalyzerOutputSchema = z.object({
  findings: z.array(FindingSchema).describe('A list of security findings discovered in the headers.'),
  exploitPayloads: z.array(ExploitPayloadSchema).optional().describe('A list of potential exploit payloads based on the findings.'),
});
export type HeaderAnalyzerOutput = z.infer<typeof HeaderAnalyzerOutputSchema>;

export async function analyzeHeaders(input: HeaderAnalyzerInput): Promise<HeaderAnalyzerOutput> {
  return headerAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'headerAnalyzerPrompt',
  input: {schema: HeaderAnalyzerInputSchema},
  output: {schema: HeaderAnalyzerOutputSchema},
  prompt: `You are a web application security expert specializing in HTTP headers.
  Analyze the following security headers for misconfigurations, weaknesses, and missing best practices.

  Headers:
  \`\`\`
  {{{headers}}}
  \`\`\`

  - For each issue found, create a finding with the header name, severity, a description of the weakness, and a remediation recommendation.
  - Common headers to check include Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security (HSTS), and Permissions-Policy.
  - For CSP, look for weak directives like 'unsafe-inline', 'unsafe-eval', or overly broad sources like '*'.
  - Based on the identified weaknesses, generate 1-2 potential exploit payloads. For example, if 'unsafe-inline' is present in script-src, provide a sample XSS payload. If X-Frame-Options is missing, provide a simple clickjacking PoC.
  `,
});

const headerAnalyzerFlow = ai.defineFlow(
  {
    name: 'headerAnalyzerFlow',
    inputSchema: HeaderAnalyzerInputSchema,
    outputSchema: HeaderAnalyzerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
