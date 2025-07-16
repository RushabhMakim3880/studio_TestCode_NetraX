
'use server';

import ngrok from 'ngrok';

// This will hold the tunnel URL once it's established.
// It acts as a simple in-memory cache for the server instance.
let ngrokUrl: string | null = null;

/**
 * A server-side only function that establishes an ngrok tunnel.
 * It caches the URL to avoid reconnecting on every call.
 * @returns A promise that resolves to the public ngrok URL.
 */
export async function startNgrokTunnel(): Promise<string> {
    // If a tunnel is already established, return the cached URL.
    if (ngrokUrl) {
        console.log(`Returning cached ngrok tunnel: ${ngrokUrl}`);
        return ngrokUrl;
    }

    console.log("No active ngrok tunnel. Initiating connection...");
    
    try {
        const url = await ngrok.connect({
            addr: 3000, // The default port for Next.js dev server
            authtoken_from_env: true,
        });
        
        ngrokUrl = url;
        console.log(`ngrok tunnel established at: ${url}`);
        return url;

    } catch (error) {
        console.error('Failed to connect to ngrok:', error);
        // Reset ngrokUrl to allow for retry attempts on subsequent calls.
        ngrokUrl = null; 
        throw new Error('Failed to establish ngrok tunnel. Please ensure your NGROK_AUTHTOKEN is set correctly.');
    }
}
