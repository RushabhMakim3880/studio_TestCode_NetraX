
'use server';
/**
 * @fileOverview An AI flow for fetching the HTML content of a public webpage.
 *
 * - clonePageFromUrl - Fetches the HTML for a given URL.
 * - ClonePageInput - The input type for the function.
 * - ClonePageOutput - The return type for the function.
 */

import { z } from 'zod';
import {ai} from '@/ai/genkit';

const ClonePageInputSchema = z.object({
  url: z.string().url('Please provide a valid URL.'),
});
export type ClonePageInput = z.infer<typeof ClonePageInputSchema>;

const ClonePageOutputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the remote page.'),
});
export type ClonePageOutput = z.infer<typeof ClonePageOutputSchema>;


const getPageContentTool = ai.defineTool(
    {
      name: 'getPageContent',
      description: 'Retrieves the raw HTML content of a public webpage.',
      inputSchema: z.object({ url: z.string().url() }),
      outputSchema: z.string(),
    },
    async (input) => {
        try {
            const response = await fetch(input.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Failed to fetch URL:', error);
            if (error instanceof Error) {
                return `Error fetching page: ${error.message}`;
            }
            return 'An unknown error occurred while fetching the page.';
        }
    }
);


const clonePageFlow = ai.defineFlow(
  {
    name: 'clonePageFlow',
    inputSchema: ClonePageInputSchema,
    outputSchema: ClonePageOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `Fetch the HTML content for the URL: ${input.url}`,
      tools: [getPageContentTool],
    });

    const toolResponse = llmResponse.toolRequest();
    if (toolResponse?.tool === 'getPageContent') {
      const content = await getPageContentTool(toolResponse.input);
       if (content.startsWith('Error fetching page:') || content.startsWith('An unknown error')) {
            throw new Error(content);
        }
      return { htmlContent: content };
    }
    
    throw new Error('The model did not use the tool to fetch the page content.');
  }
);


export async function clonePageFromUrl(input: ClonePageInput): Promise<ClonePageOutput> {
  return clonePageFlow(input);
}
