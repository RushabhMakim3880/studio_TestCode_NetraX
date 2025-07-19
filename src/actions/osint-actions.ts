
'use server';
import dns from 'dns/promises';
import { getApiKey } from '@/services/api-key-service';

/**
 * Performs a WHOIS lookup for a given domain using a public API.
 * @param domain - The domain name to look up.
 * @returns A promise that resolves to the raw WHOIS text.
 */
export async function whoisLookup(domain: string): Promise<string> {
    const apiKey = await getApiKey('WHOIS_API_KEY');
    if (!apiKey) {
        throw new Error('WHOIS_API_KEY is not configured on the server. Please add it in the Settings page.');
    }
    
    try {
        const response = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`WHOIS API request failed with status ${response.status}: ${errorBody}`);
        }
        const data = await response.json();
        if(data.WhoisRecord?.rawText) {
            return data.WhoisRecord.rawText;
        }
        if (data.ErrorMessage) {
            throw new Error(data.ErrorMessage.msg);
        }
        return "No WHOIS data received.";
    } catch (error) {
        console.error('WHOIS lookup failed:', error);
        if (error instanceof Error) {
            throw new Error(`Whois lookup failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during Whois lookup.');
    }
}


export type DnsRecord = {
  type: string;
  value: string;
  ttl: number;
};

/**
 * Performs a DNS lookup for a given domain and record type.
 * @param domain - The domain name or IP address to query.
 * @param recordType - The type of DNS record (e.g., 'A', 'MX', 'PTR').
 * @returns A promise that resolves to an array of DnsRecord objects.
 */
export async function dnsLookup(domain: string, recordType: string): Promise<DnsRecord[]> {
  try {
    const resolver = new dns.Resolver();
    
    if (recordType === 'PTR') {
        const records = await resolver.reverse(domain);
        return records.map(r => ({ type: recordType, value: r, ttl: 0 }));
    }

    const records = await resolver.resolve(domain, recordType);

    if (Array.isArray(records)) {
      if (recordType === 'MX') {
        return (records as dns.MxRecord[]).map(r => ({ type: recordType, value: `${r.priority} ${r.exchange}`, ttl: 0 }));
      }
      if(recordType === 'SOA') {
        const soa = records[0] as dns.SoaRecord;
        return [{ type: recordType, value: `ns: ${soa.nsname}, admin: ${soa.hostmaster}, serial: ${soa.serial}`, ttl: soa.ttl }];
      }
      return records.map(r => ({ type: recordType, value: r, ttl: 0 }));
    }
    // Handle cases where `resolve` returns a single object
    if (typeof records === 'object') {
        return [{ type: recordType, value: JSON.stringify(records), ttl: 0}];
    }
    
    return [];

  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
        return []; // Return empty array if no records are found, not an error.
    }
    console.error(`DNS lookup failed for ${domain} (${recordType}):`, error);
    throw new Error(`DNS lookup failed: ${error.message}`);
  }
}

/**
 * Scans for subdomains of a given domain using a public API.
 * @param domain - The domain to scan.
 * @returns A promise that resolves to an array of subdomain strings.
 */
export async function scanSubdomains(domain: string): Promise<string[]> {
    try {
        const response = await fetch(`https://api.hackertarget.com/hostsearch/?q=${domain}`);
        if (!response.ok) {
            throw new Error(`Subdomain API request failed with status ${response.status}`);
        }
        const text = await response.text();
        if (text.includes('error check your search query')) {
            return [];
        }
        return text.split('\n').map(line => line.split(',')[0]).filter(Boolean);
    } catch (error) {
        console.error('Subdomain scan failed:', error);
        throw new Error('Failed to fetch subdomain data.');
    }
}
