'use server';
/**
 * @fileOverview An AI flow for simulating taking a screenshot from a C2 agent.
 *
 * - takeScreenshot - Simulates taking a screenshot on an agent.
 * - C2ScreenshotInput - The input type for the takeScreenshot function.
 * - C2ScreenshotOutput - The return type for the takeScreenshot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const C2ScreenshotInputSchema = z.object({
  agentId: z.string().describe('The ID of the agent to take a screenshot from.'),
  os: z.string().describe('The operating system of the target agent (e.g., "Windows 11", "Ubuntu 22.04").'),
});
export type C2ScreenshotInput = z.infer<typeof C2ScreenshotInputSchema>;

export const C2ScreenshotOutputSchema = z.object({
  screenshotDataUri: z.string().describe("The simulated screenshot image as a data URI."),
  statusMessage: z.string().describe("A status message about the screenshot capture."),
});
export type C2ScreenshotOutput = z.infer<typeof C2ScreenshotOutputSchema>;

export async function takeScreenshot(input: C2ScreenshotInput): Promise<C2ScreenshotOutput> {
  return c2ScreenshotFlow(input);
}

const c2ScreenshotFlow = ai.defineFlow(
  {
    name: 'c2ScreenshotFlow',
    inputSchema: C2ScreenshotInputSchema,
    outputSchema: C2ScreenshotOutputSchema,
  },
  async (input) => {
    const promptText = `Generate a realistic screenshot of a ${input.os} desktop. It should look like a typical user's desktop, possibly with some applications open like a web browser, file explorer, or a document editor. The screenshot should be full screen resolution, like 1920x1080.`;
    
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptText,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Both must be present
      },
    });

    if (!media?.url) {
        throw new Error('Image generation failed.');
    }

    return {
        screenshotDataUri: media.url,
        statusMessage: `Screenshot captured successfully from agent ${input.agentId}.`,
    };
  }
);
