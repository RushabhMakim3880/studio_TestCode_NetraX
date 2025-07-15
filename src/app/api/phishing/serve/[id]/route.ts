
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Don't cache this response

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    try {
        // Fetch the raw HTML content from paste.rs on the server-side.
        const pasteRsResponse = await fetch(`https://paste.rs/${id}`);
        if (!pasteRsResponse.ok) {
            return new NextResponse(`Failed to fetch content from paste.rs. It may have expired.`, { status: 404 });
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
