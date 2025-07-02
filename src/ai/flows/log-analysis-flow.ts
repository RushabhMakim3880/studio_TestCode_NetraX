'use server';
/**
 * @fileOverview An AI flow for analyzing log files for security anomalies.
 *
 * - analyzeLogs - A function that analyzes log content.
 * - LogAnalysisInput - The input type for the analyzeLogs function.
 * - LogAnalysisOutput - The return type for the analyzeLogs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const LogAnalysisInputSchema = z.object({
  logContent: z.string().min(50).describe('The full content of the log file.'),
  logType: z.string().describe('The type of log (e.g., Apache Access, Syslog, Windows Event Log).'),
});
export type LogAnalysisInput = z.infer<typeof LogAnalysisInputSchema>;

const AnomalySchema = z.object({
    severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Informational']).describe('The severity of the anomaly.'),
    timestamp: z.string().optional().describe('The timestamp of the anomalous event, extracted from the log line.'),
    description: z.string().describe('A clear description of the identified security anomaly or suspicious activity.'),
    recommendation: z.string().describe('A specific recommendation on how to investigate or remediate the issue.'),
    relatedLogLine: z.string().describe('The specific log line(s) that are evidence of this anomaly.'),
});

export const LogAnalysisOutputSchema = z.object({
  summary: z.string().describe('A high-level executive summary of the findings from the log analysis.'),
  anomalies: z.array(AnomalySchema).describe('A list of security anomalies discovered in the logs.'),
});
export type LogAnalysisOutput = z.infer<typeof LogAnalysisOutputSchema>;

export async function analyzeLogs(input: LogAnalysisInput): Promise<LogAnalysisOutput> {
  return logAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'logAnalysisPrompt',
  input: {schema: LogAnalysisInputSchema},
  output: {schema: LogAnalysisOutputSchema},
  prompt: `You are a senior security operations center (SOC) analyst specializing in log analysis and threat detection.
  Your task is to analyze the provided log data for any signs of security incidents, suspicious behavior, or misconfigurations.

  Log Type: {{{logType}}}

  Log Content:
  \`\`\`
  {{{logContent}}}
  \`\`\`

  Please review the logs and generate a report.
  1.  Provide a high-level summary of the overall activity and any major findings.
  2.  Generate a list of anomalies. For each anomaly, provide a severity level, the timestamp if available, a clear description of the issue, a concrete recommendation for remediation, and the related log line(s) that show the evidence.
  Focus on actionable security insights. If no anomalies are found, return an empty array for 'anomalies'.
  `,
});

const logAnalysisFlow = ai.defineFlow(
  {
    name: 'logAnalysisFlow',
    inputSchema: LogAnalysisInputSchema,
    outputSchema: LogAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
