'use server';
/**
 * @fileOverview An AI flow for simulating a Tor browser to render a .onion page.
 *
 * - getOnionPage - Generates HTML for a fake .onion page.
 * - OnionPageInput - The input type for the function.
 * - OnionPageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OnionPageInputSchema = z.object({
  onionAddress: z.string().min(10).describe('The full .onion address to simulate.'),
});
export type OnionPageInput = z.infer<typeof OnionPageInputSchema>;

const OnionPageOutputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the generated .onion page, styled with inline Tailwind CSS classes.'),
  pageTitle: z.string().describe('A plausible title for the web page.'),
});
export type OnionPageOutput = z.infer<typeof OnionPageOutputSchema>;

export async function getOnionPage(input: OnionPageInput): Promise<OnionPageOutput> {
  return darkWebPageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'darkWebPagePrompt',
  input: {schema: OnionPageInputSchema},
  output: {schema: OnionPageOutputSchema},
  prompt: `You are a simulator of a Tor browser accessing a .onion site.
Your task is to generate the full HTML content for a plausible but FAKE dark web page based on the provided .onion address.

Address: {{{onionAddress}}}

Instructions:
1.  **Generate complete, single HTML file structure.**
2.  **Use Tailwind CSS for styling.** You MUST use the Tailwind CDN script in the head: \`<script src="https://cdn.tailwindcss.com"></script>\`. Use a dark theme (e.g., \`bg-gray-900 text-gray-300\`).
3.  **Infer the site's purpose** from the address (e.g., if it contains 'forum' or 'market', generate content for that). If it's a generic hash, create a plausible hidden service page (e.g., a blog, a directory, a simple homepage).
4.  **Content must be SFW and legal.** This is for a professional security simulation. Generate content that looks like a dark web site stylistically (text-heavy, simple layout, maybe slightly dated) but is about safe topics like privacy, cryptography, or security research.
5.  **Generate a plausible page title.**
6.  The entire output must be a single string in the 'htmlContent' field.
`,
});

const darkWebPageFlow = ai.defineFlow(
  {
    name: 'darkWebPageFlow',
    inputSchema: OnionPageInputSchema,
    outputSchema: OnionPageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
