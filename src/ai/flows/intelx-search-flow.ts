
'use server';
/**
 * @fileOverview A flow for searching the IntelX.io database.
 *
 * - intelxSearch - Searches for a term and retrieves results.
 * - IntelxSearchResponse - The return type for the function.
 */

import { z } from 'zod';
import { getApiKey } from '@/services/api-key-service';

const IntelxSearchResponseSchema = z.object({
    id: z.string(),
    status: z.number(),
});

const IntelxResultSchema = z.object({
  systemid: z.string(),
  name: z.string(),
  date: z.string(),
  bucket: z.string().optional(),
});
export type IntelxSearchResult = z.infer<typeof IntelxResultSchema>;

const IntelxResultResponseSchema = z.object({
    id: z.string(),
    status: z.number(),
    records: z.array(IntelxResultSchema),
});

export type IntelxSearchResponse = {
    success: boolean;
    results?: IntelxSearchResult[];
    error?: string;
};


async function initiateSearch(apiKey: string, term: string): Promise<string> {
    const response = await fetch('https://2.intelx.io/intelligent/search', {
        method: 'POST',
        headers: {
            'x-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            term: term,
            maxresults: 100,
            media: 0,
            sort: 2,
            terminate: [],
        }),
    });

    if (!response.ok) {
        throw new Error(`IntelX search initiation failed with status ${response.status}`);
    }

    const data = await response.json();
    const parsed = IntelxSearchResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error('Invalid response from IntelX search initiation.');
    }
    return parsed.data.id;
}


async function fetchResults(apiKey: string, systemId: string): Promise<IntelxSearchResult[]> {
    let results: IntelxSearchResult[] = [];
    let status = 0;

    // Poll for results until status is 2 (success) or 3 (no results)
    while (status !== 2 && status !== 3) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls

        const response = await fetch(`https://2.intelx.io/intelligent/search/result?id=${systemId}&limit=100`, {
            headers: { 'x-key': apiKey },
        });

        if (!response.ok) {
            throw new Error(`IntelX result fetch failed with status ${response.status}`);
        }

        const data = await response.json();
        const parsed = IntelxResultResponseSchema.safeParse(data);
        if(!parsed.success) {
             throw new Error('Invalid response from IntelX result fetch.');
        }

        results = parsed.data.records;
        status = parsed.data.status;
    }
    return results;
}

export async function intelxSearch(term: string): Promise<IntelxSearchResponse> {
  const apiKey = await getApiKey('INTELX_API_KEY');

  if (!apiKey) {
    return {
      success: false,
      error: 'IntelX API key is not configured on the server. Please add it in the Settings page.',
    };
  }

  try {
    const systemId = await initiateSearch(apiKey, term);
    const results = await fetchResults(apiKey, systemId);
    return { success: true, results };
  } catch (e: any) {
    console.error('IntelX API call failed:', e);
    return { success: false, error: e.message || 'Failed to communicate with the IntelX API.' };
  }
}
