
'use server';

import { z } from 'zod';

export type PortScanResult = {
  port: number;
  state: string;
  name: string;
  product?: string;
  version?: string;
  extrainfo?: string;
};

export type ScanPortsOptions = {
    target: string;
    scanType: 'TCP' | 'SYN';
    ports?: string;
    serviceDetection: boolean;
    osDetection: boolean;
};

type ScanResponse = {
    ports?: PortScanResult[];
    os?: any[];
    error?: string;
}

/**
 * A server action that proxies a port scan request to a local Nmap wrapper API.
 * This is designed to work with the Python script provided in the UI.
 * @param options - The scan options from the client.
 * @returns A promise that resolves to the scan results.
 */
export async function scanPorts(options: ScanPortsOptions): Promise<ScanResponse> {
    const { target, scanType, ports, serviceDetection, osDetection } = options;

    // The local Nmap wrapper API endpoint
    const localApiUrl = 'http://127.0.0.1:5000/scan';

    try {
        const response = await fetch(localApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                target,
                scan_type: scanType,
                ports,
                service_detection: serviceDetection,
                os_detection: osDetection
            }),
            // Set a reasonable timeout for the scan
            signal: AbortSignal.timeout(300000) // 5 minutes
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `Local Nmap API failed with status ${response.status}`);
        }

        const data = await response.json();
        return data as ScanResponse;

    } catch (error) {
        console.error('Port scan action failed:', error);
        if (error instanceof Error && error.name === 'AbortError') {
             return { error: 'The scan timed out after 5 minutes.' };
        }
        // This is a common error if the user hasn't started the local Python script
        if (error instanceof TypeError && error.message.includes('fetch failed')) {
            return { error: 'Connection to local Nmap API failed. Is the Python script running on http://127.0.0.1:5000?' };
        }
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred during the port scan.' };
    }
}
