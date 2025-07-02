'use server';
/**
 * @fileOverview An AI flow for simulating C2 agent check-ins.
 *
 * - getC2Checkins - Returns a list of simulated active C2 agents.
 * - C2CheckinOutput - The return type for the getC2Checkins function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentSchema = z.object({
  agentId: z.string().describe('A unique identifier for the agent (e.g., a short hash).'),
  externalIp: z.string().ip().describe('The public IP address of the compromised host.'),
  internalIp: z.string().ip().describe('The private IP address of the compromised host.'),
  hostname: z.string().describe('The hostname of the compromised machine.'),
  user: z.string().describe('The user account the agent is running as (e.g., "corp\\j.smith", "root").'),
  processName: z.string().describe('The name of the process the agent is running in (e.g., "svchost.exe", "rundll32.exe").'),
  lastSeen: z.string().describe('How long ago the agent last checked in (e.g., "32s ago", "5m ago").'),
  os: z.string().describe('The operating system of the host (e.g., "Windows 11", "Ubuntu 22.04").'),
});

const C2CheckinOutputSchema = z.object({
  agents: z.array(AgentSchema).describe('A list of 3-5 active C2 agents.'),
});
export type C2CheckinOutput = z.infer<typeof C2CheckinOutputSchema>;

export async function getC2Checkins(): Promise<C2CheckinOutput> {
  return c2CheckinFlow();
}

const prompt = ai.definePrompt({
  name: 'c2CheckinPrompt',
  output: {schema: C2CheckinOutputSchema},
  prompt: `You are a C2 (Command and Control) server simulator.
  Your task is to generate a list of 3-5 realistic-looking active agents (implants) that have recently checked in.
  - Generate a mix of Windows and Linux hosts.
  - Use private IP address ranges for internal IPs.
  - Invent plausible hostnames and usernames.
  - Use common process names for agents to hide in.
  - Make the last seen times recent and varied.
  `,
});

const c2CheckinFlow = ai.defineFlow(
  {
    name: 'c2CheckinFlow',
    outputSchema: C2CheckinOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
