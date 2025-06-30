'use server';
/**
 * @fileOverview An AI flow for generating summary reports.
 *
 * - generateSummaryReport - Generates a summary for a given report type and date range.
 * - ReportingInput - The input type for the generateSummaryReport function.
 * - ReportingOutput - The return type for the generateSummaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReportingInputSchema = z.object({
  reportType: z.string().describe("The type of report to generate (e.g., 'Phishing Campaign Results', 'Quarterly Vulnerability Summary')."),
  startDate: z.string().describe('The start date for the report period.'),
  endDate: z.string().describe('The end date for the report period.'),
});
export type ReportingInput = z.infer<typeof ReportingInputSchema>;

const ReportingOutputSchema = z.object({
  title: z.string().describe('A suitable title for the generated report.'),
  summary: z.string().describe('The generated executive summary of the report. Should be 3-4 paragraphs long.'),
  keyMetrics: z.array(z.object({
    metric: z.string().describe('The name of the key metric.'),
    value: z.string().describe('The value of the metric.'),
    change: z.string().describe('The change from the previous period (e.g., "+5%").'),
  })),
});
export type ReportingOutput = z.infer<typeof ReportingOutputSchema>;

export async function generateSummaryReport(input: ReportingInput): Promise<ReportingOutput> {
  return reportingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportingPrompt',
  input: {schema: ReportingInputSchema},
  output: {schema: ReportingOutputSchema},
  prompt: `You are an AI analyst for a cybersecurity operations center.
  Your task is to generate a simulated executive report based on the provided parameters.

  Report Type: {{{reportType}}}
  Period: {{{startDate}}} to {{{endDate}}}

  Generate a report that includes:
  1. A suitable title.
  2. A 3-4 paragraph executive summary analyzing trends and outcomes for the period. Invent plausible data and events.
  3. A list of 3-4 key metrics with plausible values and changes from the previous period.

  For example, if the report is for Phishing, metrics could include 'Emails Sent', 'Click-Through Rate', 'Credentials Compromised'.
  If for vulnerabilities, metrics could be 'New Critical Vulnerabilities', 'Time to Patch', 'Overall Risk Score'.

  The tone should be formal and data-driven. Do not include conversational text.
  `,
});

const reportingFlow = ai.defineFlow(
  {
    name: 'reportingFlow',
    inputSchema: ReportingInputSchema,
    outputSchema: ReportingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
