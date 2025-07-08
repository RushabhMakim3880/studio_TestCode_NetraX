'use server';
/**
 * @fileOverview An AI flow for generating a user invitation email.
 *
 * - generateInviteEmail - A function that returns a subject and body for an invite email.
 * - InviteUserInput - The input type for the function.
 * - InviteUserOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const InviteUserInputSchema = z.object({
  recipientEmail: z.string().email().describe('The email address of the person being invited.'),
  role: z.string().describe('The role assigned to the new user.'),
  inviterName: z.string().describe('The name of the person sending the invitation.'),
});
export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;

export const InviteUserOutputSchema = z.object({
  subject: z.string().describe('The subject line of the invitation email.'),
  body: z.string().describe('The full HTML body of the invitation email.'),
});
export type InviteUserOutput = z.infer<typeof InviteUserOutputSchema>;

export async function generateInviteEmail(input: InviteUserInput): Promise<InviteUserOutput> {
  return inviteUserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'inviteUserPrompt',
  input: {schema: InviteUserInputSchema},
  output: {schema: InviteUserOutputSchema},
  prompt: `You are an admin assistant for a secure platform called NETRA-X.
Your task is to craft a professional invitation email to a new user.

Recipient Email: {{{recipientEmail}}}
Assigned Role: {{{role}}}
Inviter: {{{inviterName}}}

Generate a compelling email subject and an HTML body.
- The email should welcome the user and state their assigned role.
- It must include a prominent "Accept Invitation" button. The button's link should be a placeholder pointing to '/register'.
- The email should look clean and professional. Use simple HTML for formatting.
- Mention that the invitation was sent by {{{inviterName}}}.
- Do not include any real malicious content or any explanations outside the email body.
`,
});

const inviteUserFlow = ai.defineFlow(
  {
    name: 'inviteUserFlow',
    inputSchema: InviteUserInputSchema,
    outputSchema: InviteUserOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
