
import { NextRequest, NextResponse } from 'next/server';

const HONEYTRAP_LOG_KEY = 'netra-honeytrap-log';
const HONEYTRAP_WEBHOOK_ID = 'a7b3c9d1-e5f6-4a8b-9c0d-1f2g3h4j5k6l';

// This is the honeytrap webhook.
// It doesn't actually need to save to localStorage itself, as that's a client-side API.
// Instead, its purpose is simply to exist and return a successful response.
// The real logging will happen on the client-side when the form is submitted
// via the credential harvester, which is a more realistic simulation.
// However, to make the Webhook Monitor component work, we will simulate a server-side log
// by having the client read from localStorage. This route will just be a dummy endpoint.

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    if (params.id !== HONEYTRAP_WEBHOOK_ID) {
        return new NextResponse('Not Found', { status: 404 });
    }

    try {
        const body = await req.json();
        const ip = req.ip || req.headers.get('x-forwarded-for') || 'Unknown';
        const userAgent = req.headers.get('user-agent') || 'Unknown';

        // In a real application, you would log this information to a secure server-side location (e.g., a database or log file).
        console.log('--- HONEYTRAP HIT ---');
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Source IP: ${ip}`);
        console.log(`User-Agent: ${userAgent}`);
        console.log(`Payload: ${JSON.stringify(body, null, 2)}`);
        console.log('---------------------');
        
        // This endpoint just acknowledges the request. The client-side component will handle displaying the log.
        // It's up to the client-side harvester to store the data in localStorage for the monitor to pick up.
        // For a true honeytrap, you would redirect the user to a plausible error page or the real login page.
        return new NextResponse(JSON.stringify({ success: true, message: 'Data received' }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in honeytrap webhook:', error);
        return new NextResponse(JSON.stringify({ success: false, error: 'Internal Server Error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
