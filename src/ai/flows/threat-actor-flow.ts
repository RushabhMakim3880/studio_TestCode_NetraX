'use server';
/**
 * @fileOverview An AI flow for generating threat actor profiles.
 *
 * - getThreatActorProfile - Generates a profile for a given threat actor name.
 * - ThreatActorInput - The input type for the function.
 * - ThreatActorProfileOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ThreatActorInputSchema = z.object({
  actorName: z.string().describe('The name of the threat actor (e.g., "APT28", "Lazarus Group").'),
});
export type ThreatActorInput = z.infer<typeof ThreatActorInputSchema>;

const ThreatActorProfileOutputSchema = z.object({
  name: z.string().describe("The name of the threat actor."),
  aliases: z.array(z.string()).describe("Known aliases for the threat actor."),
  description: z.string().describe("A summary of the threat actor's origin, motives, and typical operations."),
  targetSectors: z.array(z.string()).describe("A list of sectors commonly targeted by this actor."),
  commonTTPs: z.array(z.object({
    techniqueId: z.string().describe("The MITRE ATT&CK technique ID (e.g., T1566)."),
    techniqueName: z.string().describe("The name of the technique."),
    description: z.string().describe("A brief description of how the actor uses this technique."),
  })).describe("A list of 3-5 common Tactics, Techniques, and Procedures (TTPs) used by the actor, referencing MITRE ATT&CK."),
  associatedMalware: z.array(z.string()).describe("A list of malware families associated with this actor."),
});
export type ThreatActorProfileOutput = z.infer<typeof ThreatActorProfileOutputSchema>;

export async function getThreatActorProfile(input: ThreatActorInput): Promise<ThreatActorProfileOutput> {
  return threatActorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'threatActorProfilePrompt',
  input: {schema: ThreatActorInputSchema},
  output: {schema: ThreatActorProfileOutputSchema},
  prompt: `You are a world-class cyber threat intelligence analyst with deep knowledge of threat actors.
  Your task is to generate a detailed, simulated profile for a given threat actor.

  Threat Actor: {{{actorName}}}

  Generate a profile containing:
  - The primary name of the actor.
  - A list of known aliases (e.g., Fancy Bear, Sofacy).
  - A concise summary of their suspected origin, motivations, and operational patterns.
  - A list of their primary target sectors (e.g., Government, Defense, Aviation).
  - A list of 3-5 of their most common TTPs, including the relevant MITRE ATT&CK ID and a brief description of their usage by the actor.
  - A list of well-known malware families associated with the actor.

  The information should be realistic and sound authoritative, but it is for simulation purposes. Do not include any conversational text.
  `,
});

const threatActorFlow = ai.defineFlow(
  {
    name: 'threatActorFlow',
    inputSchema: ThreatActorInputSchema,
    outputSchema: ThreatActorProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
