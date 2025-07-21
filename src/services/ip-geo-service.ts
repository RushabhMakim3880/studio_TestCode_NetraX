
'use server';

import { z } from 'zod';

const GeoIpInfoSchema = z.object({
    status: z.string(),
    country: z.string().optional(),
    city: z.string().optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    query: z.string(),
    message: z.string().optional(),
});

export type GeoIpInfo = z.infer<typeof GeoIpInfoSchema>;

/**
 * Retrieves geolocation information for a given IP address using ip-api.com.
 * @param ip - The IP address to look up.
 * @returns A promise that resolves to the geolocation information.
 */
export async function getGeoIpInfo(ip: string): Promise<GeoIpInfo> {
    // Avoid lookups for private/local IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { status: 'success', query: ip, country: 'Local Network', city: 'Private Address' };
    }

    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon,query`);
        if (!response.ok) {
            throw new Error(`IP-API request failed with status ${response.status}`);
        }
        const data = await response.json();
        const parsed = GeoIpInfoSchema.parse(data);

        if (parsed.status === 'fail') {
            throw new Error(`IP-API lookup failed: ${parsed.message || 'Unknown error'}`);
        }
        
        return parsed;

    } catch (error) {
        console.error('getGeoIpInfo failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during geolocation.';
        // Return a failed status object that matches the schema
        return { status: 'fail', query: ip, message: errorMessage };
    }
}
