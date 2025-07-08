'use server';
/**
 * @fileOverview An AI flow for identifying the technology stack of a website.
 *
 * - getTechStack - A function that returns the technologies for a given URL.
 * - BuiltWithInput - The input type for the getTechStack function.
 * - BuiltWithOutput - The return type for the getTechStack function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BuiltWithInputSchema = z.object({
  url: z.string().url().describe('The URL of the website to analyze.'),
});
export type BuiltWithInput = z.infer<typeof BuiltWithInputSchema>;

const TechSchema = z.object({
    name: z.string().describe('The name of the technology (e.g., "React", "Nginx", "WordPress").'),
    category: z.string().describe('The category of the technology (e.g., "JavaScript Framework", "Web Server", "CMS").'),
    version: z.string().optional().describe('The detected version of the technology, if available.'),
});

const BuiltWithOutputSchema = z.object({
  technologies: z.array(TechSchema).describe('A list of technologies detected on the website.'),
});
export type BuiltWithOutput = z.infer<typeof BuiltWithOutputSchema>;

export async function getTechStack(input: BuiltWithInput): Promise<BuiltWithOutput> {
  return builtWithFlow(input);
}

const prompt = ai.definePrompt({
  name: 'builtWithPrompt',
  input: {schema: BuiltWithInputSchema},
  output: {schema: BuiltWithOutputSchema},
  prompt: `You are a technology detection tool similar to Wappalyzer or BuiltWith.
Your task is to analyze a given website URL and identify the key technologies it uses.

URL: {{{url}}}

Based on common signatures for this type of URL (e.g., a login page for a specific service, a documentation site, a blog), generate a plausible list of technologies.
- Identify the web server (e.g., Nginx, Apache).
- Identify the backend language/framework (e.g., PHP, Node.js, Ruby on Rails).
- Identify the frontend JavaScript framework (e.g., React, Vue, Angular).
- Identify any CMS (e.g., WordPress, Drupal).
- Identify analytics tools (e.g., Google Analytics).
- Identify any other notable libraries or frameworks.

Provide a version number if it's commonly associated with the technology.
The output should be for simulation purposes only.
`,
});

const builtWithFlow = ai.defineFlow(
  {
    name: 'builtWithFlow',
    inputSchema: BuiltWithInputSchema,
    outputSchema: BuiltWithOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
