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

    const formData = new URLSearchParams();
    formData.append('content', htmlContent);
    formData.append('syntax', 'html'); // Tell the service it's HTML
    formData.append('expiry_days', '1'); // Expire after 1 day for security

    const postResponse = await fetch('https://dpaste.com/api/', {
        method: 'POST',
        body: formData,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
    });
    
    if (!postResponse.ok) {
        const body = await postResponse.text();
        throw new Error(`Failed to post to hosting service. Status: ${postResponse.status}. Body: ${body}`);
    }

    const rawUrl = await postResponse.text();

    if (!rawUrl || !rawUrl.startsWith('http')) {
        throw new Error(`Hosting service returned an invalid response: ${rawUrl}`);
    }
    
    // dpaste.com API returns the raw URL directly.
    return {
      publicUrl: rawUrl.trim(),
    };

  } catch (error) {
     console.error('Error in hostClonedPageFlow:', error);
     if (error instanceof Error) {
         throw new Error(`Failed to host page: ${error.message}`);
     }
     throw new Error('An unknown error occurred during page hosting.');
  }
}
