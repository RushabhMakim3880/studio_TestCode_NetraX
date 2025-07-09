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
      // Use a public, anonymous paste service to host the raw HTML.
      const response = await fetch('https://pastes.dev/api/v2/pastes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: input.htmlContent,
            expires: "1h", // Expire after 1 hour for security
        }),
      });
      
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to post to hosting service. Status: ${response.status}. Body: ${responseText}`);
      }

      if (!responseText) {
        throw new Error('Hosting service returned an empty response.');
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Failed to parse JSON from hosting service. Response: ${responseText}`);
      }
      
      const { raw_url } = responseData;
      
      if (!raw_url) {
        throw new Error('Hosting service did not return a raw_url in its response.');
      }
      
      return {
        publicUrl: raw_url,
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
