
'use server';

import { promises as fs } from 'fs';
import path from 'path';

/**
 * A server-side action that takes HTML content and saves it to a publicly accessible file.
 * This is used by the Link Tester page for reliable page hosting.
 * @param htmlContent - The full HTML content to be saved.
 * @returns A promise that resolves to the public URL of the hosted file.
 */
export async function hostTestPage(htmlContent: string): Promise<{ url: string }> {
  try {
    // This server-side part is now simplified. It just needs to generate a unique ID.
    // The actual storage will happen on the client-side.
    const filename = `${crypto.randomUUID()}`;

    // The URL now points to our new public rendering page.
    const publicUrl = `/phish/${filename}`;
    
    return { url: publicUrl };

  } catch (error) {
    console.error('Failed to host test page:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create hosted page: ${error.message}`);
    }
    throw new Error('An unknown error occurred during page hosting.');
  }
}
