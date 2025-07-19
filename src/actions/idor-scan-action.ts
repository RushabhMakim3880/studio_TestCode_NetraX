
'use server';

export type IdorScanResult = {
  id: number;
  status: number;
  length: number;
};

type ScanOptions = {
    urlTemplate: string;
    start: number;
    end: number;
};

// This function will be called by the client, but it executes on the server.
export async function scanForIdor(options: ScanOptions): Promise<IdorScanResult[]> {
    const { urlTemplate, start, end } = options;
    const results: IdorScanResult[] = [];
    const promises: Promise<void>[] = [];

    if (!urlTemplate.includes('{ID}')) {
        throw new Error("URL template must include the placeholder '{ID}'.");
    }

    if (end - start + 1 > 500) {
        throw new Error("Scan range cannot exceed 500 requests for performance reasons.");
    }
    
    // We create an array of promises to run scans in parallel batches.
    for (let i = start; i <= end; i++) {
        const url = urlTemplate.replace('{ID}', i.toString());
        const promise = fetch(url, {
            method: 'GET',
            headers: {
                // Use a common user-agent to avoid being blocked.
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            // Important: Don't follow redirects automatically, as the redirect itself is informative.
            redirect: 'manual', 
        }).then(async (response) => {
            // Try to get content length, fall back to 0 if not present.
            const lengthHeader = response.headers.get('content-length');
            const length = lengthHeader ? parseInt(lengthHeader, 10) : 0;
            results.push({
                id: i,
                status: response.status,
                length: length,
            });
        }).catch(error => {
            // Log errors but don't stop the whole scan.
            console.error(`Error fetching ${url}:`, error);
            results.push({
                id: i,
                status: 0, // Use 0 or another indicator for a failed request.
                length: 0,
            });
        });

        promises.push(promise);
    }
    
    // Wait for all fetches to complete.
    await Promise.all(promises);

    // Sort results by ID for a clean display.
    return results.sort((a, b) => a.id - b.id);
}
