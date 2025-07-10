
'use server';
/**
 * @fileOverview A flow for "hosting" a cloned page.
 * This will save the page's HTML to a simple in-memory mock file system
 * to ensure persistence between requests.
 */

import { z } from 'zod';

// Simple in-memory "file system" to act as persistent storage.
// In a real multi-server environment, this would be a proper distributed cache (Redis) or blob storage (GCS/S3).
const mockFileStorage = new Map<string, string>();

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
    
    // Store the content in the mock file storage with the generated ID.
    mockFileStorage.set(pasteId, htmlContent);

    // Set a timeout to clear the storage after a reasonable time, e.g., 1 hour
    setTimeout(() => {
        mockFileStorage.delete(pasteId);
    }, 3600 * 1000); 

    return {
      pasteId: pasteId,
    };

  } catch (error) {
     console.error('Error in hostClonedPage:', error);
     if (error instanceof Error) {
         throw new Error(`Failed to host page: ${error.message}`);
     }
     throw new Error('An unknown error occurred during page hosting.');
  }
}

/**
 * Retrieves a page from the mock file storage.
 * This is not a Genkit flow, but an exported function for the API route.
 * @param id The ID of the page to retrieve.
 * @returns The HTML content or null if not found.
 */
export async function getClonedPage(id: string): Promise<string | null> {
    return mockFileStorage.get(id) || null;
}
