
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Don't cache this response

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    try {
        // Fetch the raw HTML content from paste.rs on the server-side.
        const pasteRsResponse = await fetch(`https://paste.rs/raw/${id}`);
        if (!pasteRsResponse.ok) {
            // Check if the content type suggests it's an error from paste.rs
            const contentType = pasteRsResponse.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                 return new NextResponse(`<html><body>Page not found or expired on hosting service.</body></html>`, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
            }
            // Handle other potential errors from paste.rs
            return new NextResponse(`Failed to fetch content from hosting service. Status: ${pasteRsResponse.status}`, { status: 502 });
        }
        
        let originalHtml = await pasteRsResponse.text();

        return new NextResponse(originalHtml, {
            status: 200,
            headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        console.error('Server-side fetch failed:', error);
        return new NextResponse('An internal error occurred while trying to load the page.', { status: 500 });
    }
}
