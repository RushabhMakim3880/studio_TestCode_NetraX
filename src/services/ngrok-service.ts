
'use server';

import ngrok from 'ngrok';

type NgrokTunnelResponse = {
    id: string;
};

/**
 * A server-side only function that establishes an ngrok tunnel.
 * It returns the tunnel ID immediately.
 * @returns A promise that resolves to the ngrok tunnel object.
 */
export async function startNgrokTunnel(): Promise<NgrokTunnelResponse> {
    try {
        console.log("Attempting to connect to ngrok...");
        const listener = await ngrok.forward({
            addr: 3000,
            authtoken_from_env: true,
        });

        console.log(`ngrok tunnel established with ID: ${listener.id()}`);
        return { id: listener.id() };

    } catch (error: unknown) {
        console.error('Failed to connect to ngrok:', error);
        
        let errorMessage = 'An unexpected error occurred while starting the ngrok tunnel.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        throw new Error(`ngrok Error: ${errorMessage}. Please check server logs and ensure NGROK_AUTHTOKEN is set.`);
    }
}

type TunnelStatusResponse = {
    status: 'connecting' | 'connected' | 'error';
    url?: string;
};

/**
 * A server-side function to check the status of an ngrok tunnel by its ID.
 * @param id - The ID of the ngrok tunnel listener.
 * @returns A promise that resolves to the tunnel's status and URL if connected.
 */
export async function getNgrokTunnelUrl({ id }: { id: string }): Promise<TunnelStatusResponse> {
    try {
        const listeners = await ngrok.listeners();
        const listener = listeners.find(l => l.id() === id);

        if (listener) {
            const url = listener.url();
            if (url) {
                return { status: 'connected', url };
            }
            return { status: 'connecting' };
        } else {
            // If the listener with the ID is gone, it's an error state.
            return { status: 'error' };
        }
    } catch (error) {
        console.error('Failed to get ngrok listeners:', error);
        return { status: 'error' };
    }
}
