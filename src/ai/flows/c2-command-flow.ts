'use server';
/**
 * @fileOverview An AI flow for simulating C2 agent command execution.
 *
 * - runC2Command - Simulates running a command on an agent.
 * - C2CommandInput - The input type for the runC2Command function.
 * - C2CommandOutput - The return type for the runC2Command function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const C2CommandInputSchema = z.object({
  command: z.string().describe('The command to execute on the agent.'),
  os: z.string().describe('The operating system of the target agent (e.g., "Windows", "Linux").'),
});
export type C2CommandInput = z.infer<typeof C2CommandInputSchema>;

const C2CommandOutputSchema = z.object({
  output: z.string().describe('The simulated terminal output from the command.'),
});
export type C2CommandOutput = z.infer<typeof C2CommandOutputSchema>;

export async function runC2Command(input: C2CommandInput): Promise<C2CommandOutput> {
  return c2CommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'c2CommandPrompt',
  input: {schema: C2CommandInputSchema},
  output: {schema: C2CommandOutputSchema},
  prompt: `You are a C2 implant (like Cobalt Strike Beacon or Meterpreter) running on a compromised host.
  The host operating system is {{{os}}}.
  Your task is to generate a realistic-looking, simulated output for a given command.

  Command: {{{command}}}

  - If the command is 'whoami', return a plausible username.
  - If the command is 'ls' or 'dir', return a list of common files and directories for the given OS.
  - If the command is 'ps', return a list of running processes.
  - If the command is 'ipconfig' or 'ifconfig', return fake network interface details.
  - For other common commands, generate a plausible output.
  - If the command is unrecognized, return an error like "command not found".

  The output should be formatted as a raw text log. Do not add any conversational text or explanations.
  `,
});

const c2CommandFlow = ai.defineFlow(
  {
    name: 'c2CommandFlow',
    inputSchema: C2CommandInputSchema,
    outputSchema: C2CommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
