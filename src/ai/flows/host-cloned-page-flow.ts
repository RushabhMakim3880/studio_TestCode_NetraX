'use server';
/**
 * @fileOverview A flow for "hosting" a cloned page.
 * This will add the page's HTML to a server-side cache and return
 * a relative URL that can be used to serve the content via an API route.
 */

import { z } from 'zod';
import { pageCache } from '@/lib/server-cache';

const HostClonedPageInputSchema = z.object({
  htmlContent: z.string().min(1, 'HTML content cannot be empty.'),
});
export type HostClonedPageInput = z.infer<typeof HostClonedPageInputSchema>;

const HostClonedPageOutputSchema = z.object({
  relativeUrl: z.string(),
});
export type HostClonedPageOutput = z.infer<typeof HostClonedPageOutputSchema>;

export async function hostClonedPage(input: HostClonedPageInput): Promise<HostClonedPageOutput> {
  try {
    const { htmlContent } = HostClonedPageInputSchema.parse(input);
    const pageId = crypto.randomUUID();

    // Store the HTML content in the server-side cache
    pageCache.set(pageId, htmlContent);

    // Set a timeout to clear the cache entry after a reasonable time (e.g., 1 hour)
    setTimeout(() => {
        pageCache.delete(pageId);
    }, 60 * 60 * 1000);

    const relativeUrl = `/api/phishing/serve/${pageId}`;

    return {
      relativeUrl: relativeUrl,
    };

  } catch (error) {
     console.error('Error in hostClonedPageFlow:', error);
     if (error instanceof Error) {
         throw new Error(`Failed to host page: ${error.message}`);
     }
     throw new Error('An unknown error occurred during page hosting.');
  }
}
