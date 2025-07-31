
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// This is a dynamic route handler, so we should not cache it.
// Note: `export const revalidate = 0;` is not needed here as API routes are dynamic by default.

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        console.warn("Phishing page request missing ID.");
        return new NextResponse('Missing page ID.', { status: 400 });
    }
    
    // Construct a safe path to the file.
    // This prevents directory traversal attacks.
    const safeFilename = path.basename(id);
    const filePath = path.join(process.cwd(), 'hosted_pages', `${safeFilename}.html`);

    try {
        await fs.access(filePath); // Check if file exists
        const htmlContent = await fs.readFile(filePath, 'utf-8');
        return new NextResponse(htmlContent, {
            status: 200,
            headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error(`Error serving page ${id}:`, error);
        // If file doesn't exist (ENOENT) or any other error, return a generic 404.
        return new NextResponse('Not Found', { status: 404 });
    }
}
