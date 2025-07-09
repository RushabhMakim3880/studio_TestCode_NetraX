'use server';
/**
 * @fileOverview A flow for "hosting" a cloned page.
 * This will post the page's HTML to a public paste service and return
 * a raw content URL that is publicly accessible.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const HostClonedPageInputSchema = z.object({
  htmlContent: z.string().min(1, 'HTML content cannot be empty.'),
});
export type HostClonedPageInput = z.infer<typeof HostClonedPageInputSchema>;

const HostClonedPageOutputSchema = z.object({
  publicUrl: z.string().url(),
});
export type HostClonedPageOutput = z.infer<typeof HostClonedPageOutputSchema>;

// This is the function the frontend will call
export async function hostClonedPage(input: HostClonedPageInput): Promise<HostClonedPageOutput> {
    return hostClonedPageFlow(input);
}

const hostClonedPageFlow = ai.defineFlow(
  {
    name: 'hostClonedPageFlow',
    inputSchema: HostClonedPageInputSchema,
    outputSchema: HostClonedPageOutputSchema,
  },
  async (input) => {
    try {
      // Use Hastebin to host the raw HTML.
      const response = await fetch('https://hastebin.com/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          // Add a plausible User-Agent to avoid being blocked by security services like Cloudflare.
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        body: input.htmlContent,
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Failed to post to hosting service. Status: ${response.status}. Body: ${responseText}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData.key) {
        throw new Error('Hosting service did not return a key in its response.');
      }

      const publicUrl = `https://hastebin.com/raw/${responseData.key}`;

      return {
        publicUrl: publicUrl,
      };

    } catch (error) {
       console.error('Error in hostClonedPageFlow:', error);
       if (error instanceof Error) {
           throw new Error(`Failed to host page: ${error.message}`);
       }
       throw new Error('An unknown error occurred during page hosting.');
    }
  }
);
