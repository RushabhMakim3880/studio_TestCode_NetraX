
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { url, method, body, headers } = await req.json();

        if (!url || !method) {
            return new NextResponse('Missing URL or method', { status: 400 });
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body ? JSON.stringify(body) : null,
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Local AI Proxy Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        // Check for common fetch errors related to local services
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
            return NextResponse.json({ error: `Could not connect to the service at the specified URL. Is it running?` }, { status: 502 });
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
