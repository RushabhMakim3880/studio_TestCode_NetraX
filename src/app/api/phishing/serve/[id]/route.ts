
import { NextRequest, NextResponse } from 'next/server';
import { pageCache } from '@/lib/server-cache';

export const revalidate = 0; // Don't cache this response

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    const htmlContent = pageCache.get(id);

    if (!htmlContent) {
        return new NextResponse('Page not found or has expired.', { status: 404 });
    }

    return new NextResponse(htmlContent, {
        status: 200,
        headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
