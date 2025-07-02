'use server';
/**
 * @fileOverview An AI flow for generating a simulated network topology map.
 *
 * - generateNetworkTopology - Generates a network map from a description.
 * - NetworkTopologyInput - The input type for the function.
 * - NetworkTopologyOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NetworkTopologyInputSchema = z.object({
  context: z.string().describe('A natural language description of the network segment to map, e.g., "Corporate guest wifi network", "DMZ servers for a web hosting company".'),
});
export type NetworkTopologyInput = z.infer<typeof NetworkTopologyInputSchema>;

const NodeSchema = z.object({
  id: z.string().ip().describe('The unique IP address for the node.'),
  type: z.enum(['workstation', 'server', 'router', 'printer', 'firewall', 'unknown']).describe('The type of device.'),
  hostname: z.string().describe('A plausible hostname for the device.'),
  os: z.string().optional().describe('The operating system, if applicable.'),
});

const LinkSchema = z.object({
  source: z.string().ip().describe('The source IP of the connection.'),
  target: z.string().ip().describe('The target IP of the connection.'),
  description: z.string().describe('A short description of the connection (e.g., "HTTP Traffic", "SMB Share Access").'),
});

const NetworkTopologyOutputSchema = z.object({
  nodes: z.array(NodeSchema).describe('A list of 4-6 network nodes discovered.'),
  links: z.array(LinkSchema).describe('A list of connections between the discovered nodes.'),
});
export type NetworkTopologyOutput = z.infer<typeof NetworkTopologyOutputSchema>;

export async function generateNetworkTopology(input: NetworkTopologyInput): Promise<NetworkTopologyOutput> {
  return networkTopologyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'networkTopologyPrompt',
  input: {schema: NetworkTopologyInputSchema},
  output: {schema: NetworkTopologyOutputSchema},
  prompt: `You are a network discovery and mapping tool.
Your task is to generate a plausible, simulated network topology based on a user-provided context.

Network Context: {{{context}}}

- Generate a list of 4 to 6 interconnected network nodes.
- Use realistic private IP address ranges (e.g., 192.168.x.x, 10.x.x.x).
- Create plausible hostnames and assign appropriate device types and operating systems.
- Create a list of links showing how these nodes might be connected to each other.
- Ensure all source and target IPs in the links correspond to IDs of nodes in the nodes list.

The output should be for simulation and training purposes.
`,
});

const networkTopologyFlow = ai.defineFlow(
  {
    name: 'networkTopologyFlow',
    inputSchema: NetworkTopologyInputSchema,
    outputSchema: NetworkTopologyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
