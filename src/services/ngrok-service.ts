
'use server';

import ngrok from 'ngrok';

type NgrokTunnelResponse = {
    url: string | null;
    error?: string;
};

/**
 * A server-side only function that establishes an ngrok tunnel and waits for it to be ready.
 * @returns A promise that resolves to an object containing the public URL or an error message.
 */
export async function startNgrokTunnel(): Promise<NgrokTunnelResponse> {
    try {
        console.log("Attempting to connect to ngrok...");
        // This will now wait until the tunnel is ready and return the URL
        const url = await ngrok.connect({
            addr: 3000,
            authtoken_from_env: true,
        });

        console.log(`ngrok tunnel established at: ${url}`);
        return { url, error: undefined };

    } catch (error: unknown) {
        console.error('Failed to connect to ngrok:', error);
        
        let errorMessage = 'An unexpected error occurred while starting the ngrok tunnel.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        return { url: null, error: `ngrok Error: ${errorMessage}. Please check server logs and ensure NGROK_AUTHTOKEN is set.` };
    }
}
