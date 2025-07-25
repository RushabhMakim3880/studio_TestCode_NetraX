
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
    // Ensure the public directory for hosted pages exists.
    const hostedDir = path.join(process.cwd(), 'public', 'hosted');
    await fs.mkdir(hostedDir, { recursive: true });

    const filename = `${crypto.randomUUID()}.html`;
    const filePath = path.join(hostedDir, filename);

    // Write the HTML content to the file.
    await fs.writeFile(filePath, htmlContent, 'utf-8');

    // The URL is relative to the public root.
    const publicUrl = `/hosted/${filename}`;
    
    return { url: publicUrl };

  } catch (error) {
    console.error('Failed to host test page:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create hosted page: ${error.message}`);
    }
    throw new Error('An unknown error occurred during page hosting.');
  }
}
