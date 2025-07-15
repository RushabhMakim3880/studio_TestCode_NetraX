
'use server';

import ngrok from 'ngrok';

// This will hold the tunnel URL once it's established.
// It acts as a simple in-memory cache for the server instance.
let ngrokUrl: string | null = null;
let isConnecting = false;

/**
 * A server-side only function that INITIATES the ngrok tunnel connection.
 * It does not wait for the tunnel to be fully established.
 */
export async function startNgrokTunnel(): Promise<void> {
    // If a tunnel is already established or is in the process of connecting, do nothing.
    if (ngrokUrl || isConnecting) {
        return;
    }

    isConnecting = true;
    console.log("No active ngrok tunnel. Initiating connection...");
    
    // We start the connection but don't await the result here.
    // The promise is handled in the background.
    ngrok.connect({
        addr: 3000, // The default port for Next.js dev server
        authtoken_from_env: true,
    }).then(url => {
        ngrokUrl = url;
        isConnecting = false;
        console.log(`ngrok tunnel established at: ${url}`);
    }).catch(error => {
        console.error('Failed to connect to ngrok:', error);
        isConnecting = false;
        // Reset ngrokUrl to allow for retry attempts.
        ngrokUrl = null; 
    });
}

/**
 * A server-side only function to get the public ngrok URL.
 * It returns the URL if it's ready, or the connection status.
 * @returns A promise that resolves to an object with the status and URL.
 */
export async function getNgrokTunnelUrl(): Promise<{ status: 'connecting' | 'connected' | 'error'; url: string | null }> {
    if (ngrokUrl) {
        return { status: 'connected', url: ngrokUrl };
    }
    if (isConnecting) {
        return { status: 'connecting', url: null };
    }
    return { status: 'error', url: null };
}
