import { pageCache } from '@/lib/server-cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id || !pageCache.has(id)) {
        return new NextResponse('Page not found.', { status: 404 });
    }
    const htmlContent = pageCache.get(id);
    return new NextResponse(htmlContent, {
        headers: { 'Content-Type': 'text/html' },
    });
}
