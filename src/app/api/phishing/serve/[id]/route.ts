import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Don't cache this response

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    try {
        // Fetch the raw content from the paste service
        const rawContentUrl = `https://paste.rs/${id}`;
        const fetchResponse = await fetch(rawContentUrl, {
             headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 0 } // Do not cache the fetch response
        });

        if (!fetchResponse.ok) {
            return new NextResponse(`Failed to fetch content from upstream service. Status: ${fetchResponse.status}`, { status: 502 });
        }
        
        const htmlContent = await fetchResponse.text();
        
        if (!htmlContent) {
            return new NextResponse('Content not found.', { status: 404 });
        }

        // Return the content with the correct HTML MIME type
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
        console.error(`Error serving page for ID ${id}:`, error);
        return new NextResponse('An internal error occurred while trying to serve the page.', { status: 500 });
    }
}
