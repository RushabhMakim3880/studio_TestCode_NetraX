'use server';
/**
 * @fileOverview A service for interacting with the Have I Been Pwned (HIBP) API.
 *
 * - searchHibp - Searches for an account in the HIBP database.
 * - HibpBreach - The Zod schema for a single breach record from HIBP.
 * - HibpApiResponse - The Zod schema for the full API response.
 */
import { z } from 'zod';

// Schema for a single breach from the HIBP API
export const HibpBreachSchema = z.object({
  Name: z.string(),
  Title: z.string(),
  Domain: z.string(),
  BreachDate: z.string(),
  AddedDate: z.string(),
  ModifiedDate: z.string(),
  PwnCount: z.number(),
  Description: z.string(), // This is HTML content
  LogoPath: z.string(),
  DataClasses: z.array(z.string()),
  IsVerified: z.boolean(),
  IsFabricated: z.boolean(),
  IsSensitive: z.boolean(),
  IsRetired: z.boolean(),
  IsSpamList: z.boolean(),
});
export type HibpBreach = z.infer<typeof HibpBreachSchema>;

// The API returns an array of these breaches
export const HibpApiResponseSchema = z.array(HibpBreachSchema);
export type HibpApiResponse = z.infer<typeof HibpApiResponseSchema>;

// Wrapper for our function's return value to include success/error status
export const HibpServiceResponseSchema = z.object({
  success: z.boolean(),
  breaches: HibpApiResponseSchema.optional(),
  error: z.string().optional(),
});
export type HibpServiceResponse = z.infer<typeof HibpServiceResponseSchema>;


export async function searchHibp(emailOrUsername: string): Promise<HibpServiceResponse> {
  const apiKey = process.env.HIBP_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'Have I Been Pwned API key is not configured on the server. Please set HIBP_API_KEY in your .env file.',
    };
  }

  const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(emailOrUsername)}`;
  const options = {
    method: 'GET',
    headers: {
      'hibp-api-key': apiKey,
      'user-agent': 'netra-x-app', // HIBP API requires a user-agent
    },
  };

  try {
    const response = await fetch(url, options);

    if (response.status === 404) {
      // 404 means the account was not found in any breaches, which is a success case.
      return { success: true, breaches: [] };
    }

    if (!response.ok) {
      // For other errors (401, 403, 500, etc.)
      const errorText = await response.text();
      return { success: false, error: `HIBP API error (${response.status}): ${errorText}` };
    }

    const responseData: HibpApiResponse = await response.json();
    const validation = HibpApiResponseSchema.safeParse(responseData);

    if (!validation.success) {
      return { success: false, error: 'Failed to parse response from HIBP API.' };
    }
    
    return { success: true, breaches: validation.data };

  } catch (e: any) {
    console.error('HIBP API call failed:', e);
    return { success: false, error: e.message || 'Failed to communicate with the HIBP API.' };
  }
}
