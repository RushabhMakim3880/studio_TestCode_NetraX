'use server';
/**
 * @fileOverview An AI flow for simulating a web injection vulnerability scan.
 *
 * - scanForInjections - A function that returns a list of potential vulnerabilities.
 * - InjectionScanInput - The input type for the scanForInjections function.
 * - InjectionScanOutput - The return type for the scanForInjections function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InjectionScanInputSchema = z.object({
  url: z.string().url().describe('The URL to scan for injection vulnerabilities.'),
});
export type InjectionScanInput = z.infer<typeof InjectionScanInputSchema>;

const VulnerabilitySchema = z.object({
    parameter: z.string().describe('The vulnerable parameter (e.g., "id", "search", "redirect_url").'),
    type: z.string().describe('The type of injection vulnerability (e.g., "SQL Injection", "Cross-Site Scripting (XSS)", "Command Injection").'),
    description: z.string().describe('A brief description of the vulnerability and how it might be exploited.'),
    confidence: z.enum(['High', 'Medium', 'Low']).describe('The confidence level of the finding.'),
});

const InjectionScanOutputSchema = z.object({
  vulnerabilities: z.array(VulnerabilitySchema).describe('A list of 1-3 potential injection vulnerabilities found on the URL.'),
});
export type InjectionScanOutput = z.infer<typeof InjectionScanOutputSchema>;

export async function scanForInjections(input: InjectionScanInput): Promise<InjectionScanOutput> {
  return injectionScannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'injectionScannerPrompt',
  input: {schema: InjectionScanInputSchema},
  output: {schema: InjectionScanOutputSchema},
  prompt: `You are a web application vulnerability scanner, like Burp Suite or OWASP ZAP, specializing in detecting injection flaws.
Your task is to generate a realistic, simulated report of potential injection vulnerabilities for a given URL.

URL: {{{url}}}

Based on the URL structure (e.g., presence of query parameters), generate a plausible list of 1 to 3 potential vulnerabilities.
- Identify a likely vulnerable parameter.
- Specify the type of injection (e.g., SQLi, XSS, OS Command Injection, Open Redirect).
- Provide a brief, clear description of the finding.
- Assign a confidence level.
- If the URL has no query parameters, you can suggest potential vulnerabilities in headers or form fields.

The output should be for simulation and training purposes. Do not provide real exploit payloads.
`,
});

const injectionScannerFlow = ai.defineFlow(
  {
    name: 'injectionScannerFlow',
    inputSchema: InjectionScanInputSchema,
    outputSchema: InjectionScanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
