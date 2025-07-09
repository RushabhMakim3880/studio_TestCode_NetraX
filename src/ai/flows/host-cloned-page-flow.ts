'use server';
/**
 * @fileOverview A flow for "hosting" a cloned page.
 * In a real local dev environment, this would start an ngrok tunnel.
 * Here, it simulates the process and returns a realistic-looking URL.
 */

import { pageCache } from '@/lib/server-cache';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
// In a real local server, you'd use the ngrok package like this:
// import ngrok from 'ngrok';

const HostClonedPageInputSchema = z.object({
  htmlContent: z.string().min(1, 'HTML content cannot be empty.'),
});
export type HostClonedPageInput = z.infer<typeof HostClonedPageInputSchema>;

const HostClonedPageOutputSchema = z.object({
  publicUrl: z.string().url(),
  localUrl: z.string().url(),
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

    // 3. Define the local URL where our app will serve the page
    const localUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/phishing/serve/${pageId}`;
    
    // --- NGROK SIMULATION ---
    // In a real local development server, you would uncomment and use the following:
    /*
    if (!process.env.NGROK_AUTHTOKEN) {
        throw new Error('NGROK_AUTHTOKEN is not set in the environment variables.');
    }
    await ngrok.authtoken(process.env.NGROK_AUTHTOKEN);
    const publicUrl = await ngrok.connect(3000); // Or the port your Next.js app is on
    const tunneledUrl = `${publicUrl}/api/phishing/serve/${pageId}`;
    */

    // For this sandboxed environment, we'll generate a realistic but FAKE ngrok URL.
    const randomSubdomain = Math.random().toString(36).substring(2, 10);
    const publicUrl = `https://${randomSubdomain}.ngrok-free.app/api/phishing/serve/${pageId}`;
    // --- END SIMULATION ---

    // Clean up the cache after a reasonable time (e.g., 1 hour)
    setTimeout(() => pageCache.delete(pageId), 3600 * 1000);

    return {
      publicUrl,
      localUrl,
    };
  }
);
