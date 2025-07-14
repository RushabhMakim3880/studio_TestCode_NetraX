'use server';
/**
 * @fileOverview A server action for fetching the HTML content of a public webpage.
 *
 * - clonePageFromUrl - Fetches the HTML for a given URL.
 * - ClonePageInput - The input type for the function.
 * - ClonePageOutput - The return type for the function.
 */

import { z } from 'zod';

const ClonePageInputSchema = z.object({
  url: z.string().url('Please provide a valid URL.'),
});
export type ClonePageInput = z.infer<typeof ClonePageInputSchema>;

const ClonePageOutputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the remote page.'),
});
export type ClonePageOutput = z.infer<typeof ClonePageOutputSchema>;


export async function clonePageFromUrl(input: ClonePageInput): Promise<ClonePageOutput> {
    try {
        const response = await fetch(input.url, {
            headers: {
                // Use a common user-agent to avoid being blocked.
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            // Some sites may require a redirect to be followed.
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page. Server responded with status: ${response.status}`);
        }

        const htmlContent = await response.text();
        return { htmlContent };

    } catch (error) {
        console.error('Failed to fetch URL:', error);
        if (error instanceof Error) {
            // Re-throw the error to be handled by the caller
            throw new Error(`Failed to fetch page content: ${error.message}`);
        }
        throw new Error('An unknown error occurred while fetching the page.');
    }
}
