'use server';
/**
 * @fileOverview A flow for "hosting" a cloned page.
 * This will store the page's HTML in a server-side cache and return
 * a real, publicly accessible URL that serves the content via an API endpoint.
 */

import { pageCache } from '@/lib/server-cache';
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
    // 1. Generate a unique ID for this page instance
    const pageId = crypto.randomUUID();

    // 2. Store the HTML content in our server-side cache
    pageCache.set(pageId, input.htmlContent);

    // 3. Define the public URL where our app will serve the page.
    // In this sandboxed environment, this URL is publicly accessible.
    const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/phishing/serve/${pageId}`;
    
    // Clean up the cache after a reasonable time (e.g., 1 hour)
    setTimeout(() => pageCache.delete(pageId), 3600 * 1000);

    return {
      publicUrl,
    };
  }
);
