'use server';
/**
 * @fileOverview An AI flow for simulating a password cracking tool.
 *
 * - crackPassword - Simulates cracking a hash with a wordlist.
 * - PasswordCrackerInput - The input type for the function.
 * - PasswordCrackerOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const PasswordCrackerInputSchema = z.object({
  hash: z.string().describe('The password hash to crack.'),
  hashType: z.string().describe('The type of hash (e.g., MD5, SHA1).'),
  wordlist: z.string().describe('The wordlist to use for the attack (e.g., rockyou.txt).'),
});
export type PasswordCrackerInput = z.infer<typeof PasswordCrackerInputSchema>;

const PasswordCrackerOutputSchema = z.object({
  isCracked: z.boolean().describe('Whether the password was successfully cracked.'),
  crackedPassword: z.string().optional().describe('The cracked password, if successful.'),
  log: z.string().describe('A simulated log output from the cracking tool.'),
});
export type PasswordCrackerOutput = z.infer<typeof PasswordCrackerOutputSchema>;

export async function crackPassword(input: PasswordCrackerInput): Promise<PasswordCrackerOutput> {
  return passwordCrackerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'passwordCrackerPrompt',
  input: {schema: PasswordCrackerInputSchema},
  output: {schema: PasswordCrackerOutputSchema},
  prompt: `You are a password cracking tool simulator, like Hashcat or John the Ripper.
Your task is to generate a realistic-looking, simulated output log for cracking a given hash with a wordlist.

Hash: {{{hash}}}
Hash Type: {{{hashType}}}
Wordlist: {{{wordlist}}}

- Based on the wordlist name (e.g., rockyou.txt suggests a high chance of success), decide if the crack should be successful. Make it successful about 70% of the time for large, well-known wordlists.
- If successful, invent a simple, plausible password (e.g., 'password123', 'sunshine', '123456') and set 'isCracked' to true.
- Generate a log that shows the tool starting, loading the wordlist, trying passwords, and the final status.
- The log should include things like session name, hash type, rules, progress (e.g., '25.31%'), and speed (e.g., '152.4 kH/s').
- If the password is cracked, the log should end by showing the hash and the cracked password.
- If the password is not cracked, the log should end with a "exhausted" message.

The output should be purely for simulation. Do not use real cracking techniques. Do not add conversational text.
`,
});

const passwordCrackerFlow = ai.defineFlow(
  {
    name: 'passwordCrackerFlow',
    inputSchema: PasswordCrackerInputSchema,
    outputSchema: PasswordCrackerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
