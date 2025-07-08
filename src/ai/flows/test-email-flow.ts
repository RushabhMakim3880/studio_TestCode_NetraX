'use server';
/**
 * @fileOverview An AI flow for simulating sending a test email via SMTP.
 *
 * - sendTestEmail - A function that returns a simulated success status and log.
 * - TestEmailInput - The input type for the function.
 * - TestEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const TestEmailInputSchema = z.object({
  smtpHost: z.string().describe('The SMTP server hostname.'),
  smtpPort: z.string().describe('The SMTP server port.'),
  smtpUser: z.string().describe('The SMTP username.'),
  recipientEmail: z.string().email().describe('The email address to send the test email to.'),
});
export type TestEmailInput = z.infer<typeof TestEmailInputSchema>;

export const TestEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the test email was "sent" successfully.'),
  log: z.string().describe('A realistic, multi-line log of the SMTP connection and sending process.'),
});
export type TestEmailOutput = z.infer<typeof TestEmailOutputSchema>;

export async function sendTestEmail(input: TestEmailInput): Promise<TestEmailOutput> {
  return testEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'testEmailPrompt',
  input: {schema: TestEmailInputSchema},
  output: {schema: TestEmailOutputSchema},
  prompt: `You are an SMTP server simulator. Your task is to generate a realistic connection and email sending log.
About 90% of the time, the connection should be successful.

SMTP Host: {{{smtpHost}}}
SMTP Port: {{{smtpPort}}}
SMTP User: {{{smtpUser}}}
Recipient: {{{recipientEmail}}}

Generate a multi-line log simulating the following steps:
- Resolving SMTP host
- Connecting to the host and port
- EHLO/HELO command
- AUTH LOGIN command (show username being sent in base64, but not the password)
- MAIL FROM / RCPT TO commands
- DATA command with a short test message
- Final confirmation (e.g., "250 OK: Queued as ...") or an error message if you decide it should fail.

If successful, set 'success' to true. If it fails (e.g., auth error, connection timeout), set 'success' to false and make the log reflect the error.
`,
});

const testEmailFlow = ai.defineFlow(
  {
    name: 'testEmailFlow',
    inputSchema: TestEmailInputSchema,
    outputSchema: TestEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
