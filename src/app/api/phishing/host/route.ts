
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Saves HTML content to a file on the server's filesystem under a unique ID.
 * This is a more robust approach than relying on client-side storage or ngrok for hosting.
 * @param request - The incoming POST request containing the HTML content.
 * @returns A JSON response with the unique ID for the saved page or an error.
 */
export async function POST(request: NextRequest) {
  try {
    const { htmlContent } = await request.json();
    if (!htmlContent) {
      return NextResponse.json({ success: false, error: 'No HTML content provided.' }, { status: 400 });
    }
    
    // Generate a unique ID for the page file
    const pageId = crypto.randomUUID();
    const fileName = `${pageId}.html`;

    // Ensure the `hosted_pages` directory exists
    const dirPath = path.join(process.cwd(), 'hosted_pages');
    await fs.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, fileName);
    
    // Write the HTML content to the file
    await fs.writeFile(filePath, htmlContent, 'utf-8');

    // Return the ID so the client can construct the public URL
    return NextResponse.json({ success: true, pageId: pageId });

  } catch (error) {
    console.error("Failed to host page on server:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ success: false, error: `Could not save the page to the server: ${message}` }, { status: 500 });
  }
}
