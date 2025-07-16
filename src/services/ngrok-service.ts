
'use server';

import ngrok from 'ngrok';

/**
 * A server-side only function that establishes an ngrok tunnel.
 * @returns A promise that resolves to the public ngrok URL.
 */
export async function startNgrokTunnel(): Promise<string> {
    try {
        console.log("Attempting to connect to ngrok...");
        const url = await ngrok.connect({
            addr: 3000,
            authtoken_from_env: true,
        });
        
        console.log(`ngrok tunnel established at: ${url}`);
        return url;

    } catch (error: unknown) {
        console.error('Failed to connect to ngrok:', error);
        
        let errorMessage = 'An unexpected error occurred while starting the ngrok tunnel.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (typeof error === 'object' && error !== null) {
            // Handle cases where ngrok might throw a non-standard error object
            try {
                const errorString = JSON.stringify(error);
                if (errorString !== '{}') {
                   errorMessage = errorString;
                }
            } catch {
                // Ignore JSON stringify errors
            }
        }
        
        throw new Error(`ngrok Error: ${errorMessage}. Please check server logs and ensure NGROK_AUTHTOKEN is set.`);
    }
}
