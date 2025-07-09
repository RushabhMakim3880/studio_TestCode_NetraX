'use server';
/**
 * @fileOverview A flow for "hosting" a cloned page.
 * This will upload the page's HTML to a public paste service and return
 * the raw URL that can be used to serve the content.
 */

import { z } from 'zod';

const HostClonedPageInputSchema = z.object({
  htmlContent: z.string().min(1, 'HTML content cannot be empty.'),
});
export type HostClonedPageInput = z.infer<typeof HostClonedPageInputSchema>;

const HostClonedPageOutputSchema = z.object({
  publicUrl: z.string().url(),
});
export type HostClonedPageOutput = z.infer<typeof HostClonedPageOutputSchema>;


export async function hostClonedPage(input: HostClonedPageInput): Promise<HostClonedPageOutput> {
  try {
    const { htmlContent } = HostClonedPageInputSchema.parse(input);

    // Using FormData is required for this service to correctly handle the content.
    const formData = new FormData();
    formData.append('content', htmlContent);

    const postResponse = await fetch('https://paste.rs', {
        method: 'POST',
        body: formData,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
    });
    
    if (!postResponse.ok) {
        const body = await postResponse.text();
        throw new Error(`Failed to post to hosting service. Status: ${postResponse.status}. Body: ${body}`);
    }

    const publicUrl = await postResponse.text();

    if (!publicUrl || !publicUrl.startsWith('http')) {
        throw new Error(`Hosting service returned an invalid URL: ${publicUrl}`);
    }
    
    // The service returns the view URL. We need to append '/raw' for the raw HTML content.
    const rawUrl = `${publicUrl}/raw`;

    return {
      publicUrl: rawUrl,
    };

  } catch (error) {
     console.error('Error in hostClonedPageFlow:', error);
     if (error instanceof Error) {
         throw new Error(`Failed to host page: ${error.message}`);
     }
     throw new Error('An unknown error occurred during page hosting.');
  }
}
