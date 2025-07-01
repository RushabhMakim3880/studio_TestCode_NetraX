'use server';
/**
 * @fileOverview An AI flow for analyzing configuration files for security vulnerabilities.
 *
 * - analyzeConfiguration - A function that analyzes a configuration file.
 * - ConfigAnalyzerInput - The input type for the analyzeConfiguration function.
 * - ConfigAnalyzerOutput - The return type for the analyzeConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfigAnalyzerInputSchema = z.object({
  configContent: z.string().min(10).describe('The full content of the configuration file.'),
  configType: z.string().describe('The type of configuration (e.g., Nginx, Apache, SSH, Dockerfile).'),
});
export type ConfigAnalyzerInput = z.infer<typeof ConfigAnalyzerInputSchema>;

const FindingSchema = z.object({
    severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Informational']).describe('The severity of the finding.'),
    description: z.string().describe('A clear description of the identified security weakness or misconfiguration.'),
    recommendation: z.string().describe('A specific recommendation on how to remediate the issue.'),
});

const ConfigAnalyzerOutputSchema = z.object({
  findings: z.array(FindingSchema).describe('A list of security findings discovered in the configuration file.'),
});
export type ConfigAnalyzerOutput = z.infer<typeof ConfigAnalyzerOutputSchema>;

export async function analyzeConfiguration(input: ConfigAnalyzerInput): Promise<ConfigAnalyzerOutput> {
  return configAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'configAnalyzerPrompt',
  input: {schema: ConfigAnalyzerInputSchema},
  output: {schema: ConfigAnalyzerOutputSchema},
  prompt: `You are a senior security auditor specializing in infrastructure hardening.
  Your task is to analyze the provided configuration file for security weaknesses, misconfigurations, and deviations from best practices.

  Configuration Type: {{{configType}}}

  Configuration Content:
  \`\`\`
  {{{configContent}}}
  \`\`\`

  Please review the configuration and generate a list of findings. For each finding, provide a severity level, a clear description of the issue, and a concrete recommendation for remediation. Focus on actionable security improvements.
  `,
});

const configAnalyzerFlow = ai.defineFlow(
  {
    name: 'configAnalyzerFlow',
    inputSchema: ConfigAnalyzerInputSchema,
    outputSchema: ConfigAnalyzerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
