
'use server';

import ngrok from 'ngrok';

let ngrokUrl: string | null = null;
let isConnecting = false;

/**
 * A server-side only function to get a public URL from ngrok.
 * It caches the URL to avoid creating multiple tunnels.
 * @returns A promise that resolves to the ngrok public URL.
 */
export async function getNgrokUrl(): Promise<string | null> {
    if (ngrokUrl) {
        return ngrokUrl;
    }

    // Prevent multiple concurrent connection attempts
    if (isConnecting) {
        // Wait for the connection to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getNgrokUrl(); // Retry getting the now-cached URL
    }

    isConnecting = true;

    try {
        console.log("No active ngrok tunnel. Attempting to connect...");
        // This will use the authtoken from the NGROK_AUTHTOKEN environment variable
        // if it's set in your .env file.
        const url = await ngrok.connect({
            addr: 3000, // The default port for Next.js dev server
            authtoken_from_env: true,
        });
        ngrokUrl = url;
        console.log(`ngrok tunnel established at: ${url}`);
        return url;
    } catch (error) {
        console.error('Failed to connect to ngrok:', error);
        // Reset the flag if connection fails
        isConnecting = false;
        // In a real app, you might want more sophisticated error handling or retries.
        return null; 
    } finally {
        isConnecting = false;
    }
}
