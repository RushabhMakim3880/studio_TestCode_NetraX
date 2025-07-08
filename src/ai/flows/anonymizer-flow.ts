'use server';
/**
 * @fileOverview An AI flow for simulating a VPN and proxy chain connection.
 *
 * - simulateConnection - Generates a connection log and a new public IP.
 * - AnonymizerInput - The input type for the function.
 * - AnonymizerOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AnonymizerInputSchema = z.object({
  vpnExitCountry: z.string().optional().describe('The selected country for the VPN exit node.'),
  proxyChain: z.array(z.object({
    country: z.string(),
    type: z.string(),
  })).describe('An ordered list of proxies to chain.'),
});
export type AnonymizerInput = z.infer<typeof AnonymizerInputSchema>;

export const AnonymizerOutputSchema = z.object({
  connectionLog: z.string().describe('A realistic, step-by-step log of the connection process.'),
  newPublicIp: z.string().describe('The new, simulated public IP address of the final exit node.'),
  finalCountry: z.string().describe('The country of the final exit node.'),
});
export type AnonymizerOutput = z.infer<typeof AnonymizerOutputSchema>;

export async function simulateConnection(input: AnonymizerInput): Promise<AnonymizerOutput> {
  return anonymizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'anonymizerPrompt',
  input: {schema: AnonymizerInputSchema},
  output: {schema: AnonymizerOutputSchema},
  prompt: `You are a network anonymization tool like Tor or a commercial VPN/proxy service.
Your task is to generate a realistic-looking connection log for the specified VPN and proxy chain configuration.

Configuration:
{{#if vpnExitCountry}}
- VPN Exit Node: {{{vpnExitCountry}}}
{{/if}}
- Proxy Chain:
{{#each proxyChain}}
  - Hop: {{{type}}} Proxy in {{{country}}}
{{/each}}
{{#unless proxyChain}}
- No proxies configured.
{{/unless}}

Generate the following:
1.  **connectionLog**: A multi-line, step-by-step log of the connection process. Include timestamps, handshake simulations, IP routing messages, and success confirmations. The log should reflect the order of connections (VPN first, then each proxy hop).
2.  **newPublicIp**: A new, plausible public IPv4 address. This IP should belong to the country of the *last* node in the chain (the last proxy if one exists, otherwise the VPN country).
3.  **finalCountry**: The country name of the final exit node.

The output should be for simulation purposes only. Do not use real IP addresses if possible, but make them look valid.
`,
});

const anonymizerFlow = ai.defineFlow(
  {
    name: 'anonymizerFlow',
    inputSchema: AnonymizerInputSchema,
    outputSchema: AnonymizerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
