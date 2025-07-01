'use server';
/**
 * @fileOverview An AI flow for generating reverse shell payloads.
 *
 * - generatePayload - Generates a payload script based on user specifications.
 * - PayloadGeneratorInput - The input type for the function.
 * - PayloadGeneratorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PayloadGeneratorInputSchema = z.object({
  payloadType: z.string().describe('The type of payload to generate (e.g., "Powershell TCP Reverse Shell", "Bash TCP Reverse Shell", "Python Reverse Shell").'),
  lhost: z.string().describe('The listening host IP address for the reverse shell.'),
  lport: z.string().describe('The listening port for the reverse shell.'),
});
export type PayloadGeneratorInput = z.infer<typeof PayloadGeneratorInputSchema>;

const PayloadGeneratorOutputSchema = z.object({
  payload: z.string().describe('The generated payload script.'),
  description: z.string().describe('A brief description of the payload and how to use it.'),
});
export type PayloadGeneratorOutput = z.infer<typeof PayloadGeneratorOutputSchema>;

export async function generatePayload(input: PayloadGeneratorInput): Promise<PayloadGeneratorOutput> {
  return payloadGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'payloadGeneratorPrompt',
  input: {schema: PayloadGeneratorInputSchema},
  output: {schema: PayloadGeneratorOutputSchema},
  prompt: `You are an expert in creating reverse shell payloads for penetration testing.
Your task is to generate a functional payload script based on the provided specifications.

Payload Type: {{{payloadType}}}
Listening Host (LHOST): {{{lhost}}}
Listening Port (LPORT): {{{lport}}}

Generate the code for the payload.
Also, provide a short description explaining what the payload does and how to set up a listener for it (e.g., using 'nc -lvnp {{{lport}}}').

Generate only the payload code and the description. Do not include any explanations, markdown formatting, or conversational text outside of the specified output fields.
The payload should be a single line command if possible, for easy execution.
`,
});

const payloadGeneratorFlow = ai.defineFlow(
  {
    name: 'payloadGeneratorFlow',
    inputSchema: PayloadGeneratorInputSchema,
    outputSchema: PayloadGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
