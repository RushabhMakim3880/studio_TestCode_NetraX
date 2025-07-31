
'use server';

// This file is deprecated as ngrok is no longer used for hosting.
// It can be safely removed in a future cleanup.

export async function startNgrokTunnel(): Promise<{ url: string | null }> {
    console.warn("DEPRECATION WARNING: startNgrokTunnel is deprecated and should not be used. The application now uses server-side page hosting.");
    return { url: null };
}
