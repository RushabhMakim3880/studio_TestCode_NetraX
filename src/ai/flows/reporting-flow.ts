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

const ChartDataSchema = z.object({
    name: z.string().describe("The label for the data point (e.g., a date, a category)."),
    value: z.number().describe("The numerical value for the data point."),
});

const ReportingOutputSchema = z.object({
  title: z.string().describe('A suitable title for the generated report.'),
  summary: z.string().describe('The generated executive summary of the report. Should be 3-4 paragraphs long.'),
  keyMetrics: z.array(z.object({
    metric: z.string().describe('The name of the key metric.'),
    value: z.string().describe('The value of the metric.'),
    change: z.string().describe('The change from the previous period (e.g., "+5%").'),
  })),
  chartTitle: z.string().describe("A title for the accompanying chart (e.g., 'Weekly Phishing Clicks')."),
  chartData: z.array(ChartDataSchema).describe("An array of 4-6 data points for a bar chart."),
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
  2. A comprehensive 3-4 paragraph executive summary analyzing trends and outcomes for the period. Invent plausible data and events.
  3. A list of 3-4 key metrics with plausible values and changes from the previous period.
  4. A suitable title for a bar chart that visualizes a key aspect of the report.
  5. An array of 4 to 6 data points for the bar chart. The 'name' should be a label (like a week or month) and 'value' a number.

  For example, if the report is for Phishing, metrics could include 'Emails Sent', 'Click-Through Rate', 'Credentials Compromised'. The chart could show clicks per week.
  If for vulnerabilities, metrics could be 'New Critical Vulnerabilities', 'Time to Patch', 'Overall Risk Score'. The chart could show vulnerabilities found per month.

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
