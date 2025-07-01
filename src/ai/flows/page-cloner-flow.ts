'use server';
/**
 * @fileOverview An AI flow for simulating a login page cloner.
 *
 * - cloneLoginPage - Generates HTML for a fake login page based on a description.
 * - PageClonerInput - The input type for the cloneLoginPage function.
 * - PageClonerOutput - The return type for the cloneLoginPage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const PageClonerInputSchema = z.object({
  targetUrl: z.string().url().describe('The URL of the site to clone the login page from. This is for context.'),
  pageDescription: z.string().describe('A description of the login page to create (e.g., "A Microsoft 365 login page", "A generic corporate SSO portal").'),
});
export type PageClonerInput = z.infer<typeof PageClonerInputSchema>;

export const PageClonerOutputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the generated login page, styled with inline Tailwind CSS classes.'),
});
export type PageClonerOutput = z.infer<typeof PageClonerOutputSchema>;

export async function cloneLoginPage(input: PageClonerInput): Promise<PageClonerOutput> {
  return pageClonerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pageClonerPrompt',
  input: {schema: PageClonerInputSchema},
  output: {schema: PageClonerOutputSchema},
  prompt: `You are an expert web developer specializing in creating realistic HTML login page templates.
  Your task is to generate the HTML and Tailwind CSS for a login page based on a target URL and description.
  The goal is to create a visually convincing but non-functional clone for a red team phishing exercise.

  Target URL (for context): {{{targetUrl}}}
  Page Description: {{{pageDescription}}}

  Instructions:
  1.  Generate a complete, single HTML file structure.
  2.  Use Tailwind CSS classes directly in the HTML for styling. You must not use <style> tags or external stylesheets. Link to the Tailwind CDN in the head: <script src="https://cdn.tailwindcss.com"></script>.
  3.  The form's 'action' attribute should be set to "#".
  4.  The form should contain fields for username/email and password, and a submit button.
  5.  Make the page look as professional and authentic as possible based on the description. Include a fake logo or title.
  6.  Do not include any JavaScript. This is a static HTML page.
  7.  The entire output must be a single string in the 'htmlContent' field.
  `,
});

const pageClonerFlow = ai.defineFlow(
  {
    name: 'pageClonerFlow',
    inputSchema: PageClonerInputSchema,
    outputSchema: PageClonerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
