
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // This endpoint is deprecated in favor of the more general local-ai-proxy.
    return new NextResponse(JSON.stringify({ message: "This endpoint is deprecated." }), {
        status: 410,
        headers: { "Content-Type": "application/json" },
    });
}
