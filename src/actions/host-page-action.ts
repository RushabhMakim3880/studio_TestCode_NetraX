
'use server';

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Saves HTML content to a file on the server's filesystem under a unique ID.
 * This is a more robust approach than relying on client-side storage or ngrok for hosting.
 * @param htmlContent - The HTML string to save.
 * @returns The unique ID for the saved document.
 */
export async function hostPageOnServer(htmlContent: string): Promise<string> {
    if (!htmlContent) {
        throw new Error('No HTML content provided.');
    }
    
    try {
        // Generate a unique ID for the page file
        const pageId = crypto.randomUUID();
        const fileName = `${pageId}.html`;

        // Ensure the `hosted_pages` directory exists in the project root
        const dirPath = path.join(process.cwd(), 'hosted_pages');
        await fs.mkdir(dirPath, { recursive: true });

        const filePath = path.join(dirPath, fileName);
        
        // Write the HTML content to the file
        await fs.writeFile(filePath, htmlContent, 'utf-8');

        // Return the ID so the client can construct the public URL
        return pageId;

    } catch (error) {
        console.error("Failed to host page on server:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Could not save the page to the server: ${message}`);
    }
}
