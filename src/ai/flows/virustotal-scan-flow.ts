
'use server';
/**
 * @fileOverview A flow for scanning a file hash using the VirusTotal API.
 * It securely retrieves the API key from server-side environment variables.
 *
 * - scanFileHash - Scans a file hash using the VirusTotal API.
 * - VirusTotalScanInput - The input type for the scanFileHash function.
 * - VirusTotalScanOutput - The return type for the scanFileHash function.
 */

import { z } from 'zod';
import { getApiKey } from '@/services/api-key-service';

const VirusTotalScanInputSchema = z.object({
  hash: z.string().min(32).describe('The file hash (MD5, SHA1, or SHA256) to scan.'),
});
export type VirusTotalScanInput = z.infer<typeof VirusTotalScanInputSchema>;

const ScanEngineResultSchema = z.object({
  engine_name: z.string(),
  category: z.string(),
  result: z.string().nullable(),
});

const LastAnalysisStatsSchema = z.object({
    harmless: z.number(),
    malicious: z.number(),
    suspicious: z.number(),
    timeout: z.number(),
    undetected: z.number(),
});

const VirusTotalApiDataSchema = z.object({
    id: z.string(),
    type: z.string(),
    links: z.object({ self: z.string() }),
    attributes: z.object({
      last_analysis_stats: LastAnalysisStatsSchema,
      last_analysis_date: z.number().optional(),
      last_analysis_results: z.record(ScanEngineResultSchema),
      meaningful_name: z.string().optional(),
      type_description: z.string().optional(),
    }),
});

const VirusTotalScanOutputSchema = z.object({
  success: z.boolean(),
  data: VirusTotalApiDataSchema.optional(),
  error: z.string().optional(),
});
export type VirusTotalScanOutput = z.infer<typeof VirusTotalScanOutputSchema>;


export async function scanFileHash(input: VirusTotalScanInput): Promise<VirusTotalScanOutput> {
  const apiKey = getApiKey('VIRUSTOTAL_API_KEY');

  if (!apiKey) {
    return {
      success: false,
      error: 'VirusTotal API key is not configured on the server. Please add VIRUSTOTAL_API_KEY to the .env file.',
    };
  }

  const url = `https://www.virustotal.com/api/v3/files/${input.hash}`;
  const options = {
    method: 'GET',
    headers: {
      'x-apikey': apiKey,
      'Accept': 'application/json',
    },
  };

  try {
    const response = await fetch(url, options);

    if (response.status === 404) {
      return { success: false, error: 'This file hash was not found in the VirusTotal database.' };
    }
    if (!response.ok) {
      const errorBody = await response.json();
      const errorMessage = errorBody.error?.message || `API request failed with status ${response.status}`;
      return { success: false, error: errorMessage };
    }

    const responseData = await response.json();
    const parsed = VirusTotalApiDataSchema.safeParse(responseData.data);
    if (!parsed.success) {
      console.error("VirusTotal API response validation error:", parsed.error);
      return { success: false, error: "Received an invalid response format from VirusTotal." };
    }

    return { success: true, data: parsed.data };
  } catch (e: any) {
    console.error('VirusTotal API call failed:', e);
    return { success: false, error: e.message || 'Failed to communicate with the VirusTotal API.' };
  }
}
