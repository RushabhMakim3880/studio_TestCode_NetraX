
'use server';

/**
 * Sends HTML content to a dedicated API endpoint for hosting.
 * This function acts as a client to our own hosting API.
 * @param htmlContent - The HTML string to save.
 * @returns The unique ID for the saved document.
 */
export async function hostPageOnServer(htmlContent: string): Promise<string> {
    const hostApiUrl = '/api/phishing/host'; // The internal API route
    
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${hostApiUrl}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ htmlContent }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to host page.');
        }

        return result.pageId;

    } catch (error) {
        console.error("Failed to host page via API:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Could not save the page to the server: ${message}`);
    }
}
