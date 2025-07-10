
'use server';
/**
 * @fileOverview A flow for "hosting" a cloned page.
 * This will save the page's HTML to a simple in-memory cache
 * and return an ID. This avoids making any outbound network requests from the server.
 */

import { z } from 'zod';
import { pageCache } from '@/lib/server-cache';

const HostClonedPageInputSchema = z.object({
  htmlContent: z.string().min(1, 'HTML content cannot be empty.'),
});
export type HostClonedPageInput = z.infer<typeof HostClonedPageInputSchema>;

const HostClonedPageOutputSchema = z.object({
  pasteId: z.string().min(1),
});
export type HostClonedPageOutput = z.infer<typeof HostClonedPageOutputSchema>;


export async function hostClonedPage(input: HostClonedPageInput): Promise<HostClonedPageOutput> {
  try {
    const { htmlContent } = HostClonedPageInputSchema.parse(input);

    const pasteId = crypto.randomUUID();
    
    // Store the content in the in-memory cache with the generated ID.
    // In a real multi-server environment, this would be a distributed cache like Redis.
    pageCache.set(pasteId, htmlContent);

    // Set a timeout to clear the cache after a reasonable time, e.g., 1 hour
    setTimeout(() => {
        pageCache.delete(pasteId);
    }, 3600 * 1000); 

    return {
      pasteId: pasteId,
    };

  } catch (error) {
     console.error('Error in hostClonedPageFlow:', error);
     if (error instanceof Error) {
         throw new Error(`Failed to host page: ${error.message}`);
     }
     throw new Error('An unknown error occurred during page hosting.');
  }
}
