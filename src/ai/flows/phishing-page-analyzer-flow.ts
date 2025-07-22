
'use server';
/**
 * @fileOverview An AI flow for analyzing a webpage's content for phishing indicators.
 *
 * - analyzePhishingPage - A function that returns a phishing analysis report.
 * - PhishingPageAnalysisInput - The input type for the function.
 * - PhishingPageAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { clonePageFromUrl } from './clone-page-from-url-flow';

const PhishingPageAnalysisInputSchema = z.object({
  url: z.string().url().describe('The URL of the page to analyze.'),
});
export type PhishingPageAnalysisInput = z.infer<typeof PhishingPageAnalysisInputSchema>;

const PhishingPageAnalysisSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('The overall estimated risk level of the page.'),
  summary: z.string().describe('A one-paragraph summary of the analysis and why the risk level was assigned.'),
  flags: z.array(z.string()).describe('A list of specific observations or red flags that led to the assessment (e.g., "Contains a login form but is not served over HTTPS").'),
});
export type PhishingPageAnalysis = z.infer<typeof PhishingPageAnalysisSchema>;

export async function analyzePhishingPage(input: PhishingPageAnalysisInput): Promise<PhishingPageAnalysis> {
  return phishingPageAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'phishingPageAnalyzerPrompt',
  input: {
      schema: z.object({
          url: z.string().url(),
          htmlContent: z.string(),
      })
  },
  output: {schema: PhishingPageAnalysisSchema},
  prompt: `You are a cybersecurity analyst specializing in phishing detection.
Your task is to analyze the provided URL and HTML content of a webpage to determine if it is likely a phishing page.

URL: {{{url}}}
HTML Content:
\`\`\`html
{{{htmlContent}}}
\`\`\`

Analyze the content and URL for common phishing indicators:
- Brand impersonation (e.g., looks like a well-known login page but the URL is different).
- Presence of login forms (username/password fields).
- Urgency-Inducing Language (e.g., "Your account will be suspended").
- Non-HTTPS on a login page.
- Obscure or suspicious links.
- Generic greetings.

Based on your analysis, provide a risk level (Low, Medium, High), a summary of your findings, and a list of specific red flags you identified.
`,
});

const phishingPageAnalyzerFlow = ai.defineFlow(
  {
    name: 'phishingPageAnalyzerFlow',
    inputSchema: PhishingPageAnalysisInputSchema,
    outputSchema: PhishingPageAnalysisSchema,
  },
  async (input) => {
    // First, clone the page content
    const { htmlContent } = await clonePageFromUrl({ url: input.url });

    // Then, pass the content and URL to the AI for analysis
    const {output} = await prompt({
        url: input.url,
        htmlContent: htmlContent,
    });
    return output!;
  }
);
