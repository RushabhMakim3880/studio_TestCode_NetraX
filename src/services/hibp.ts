
'use server';
/**
 * @fileOverview A service for interacting with a public breach compilation database.
 * This has been updated to use the proxynova API instead of HIBP.
 *
 * - searchBreachCompilation - Searches for an account in a public combo list database.
 */
import { z } from 'zod';

// Schema for the expected response from the proxynova comb API
const BreachCompilationResultSchema = z.object({
  lines: z.array(z.string()),
  count: z.number(),
});

// Wrapper for our function's return value to include success/error status
const BreachCompilationServiceResponseSchema = z.object({
  success: z.boolean(),
  results: BreachCompilationResultSchema.optional(),
  error: z.string().optional(),
});
type BreachCompilationServiceResponse = z.infer<typeof BreachCompilationServiceResponseSchema>;

export async function searchBreachCompilation(query: string): Promise<BreachCompilationServiceResponse> {
  // Use the free API as requested by the user
  const url = `https://api.proxynova.com/comb?query=${encodeURIComponent(query)}&limit=50`; // Limit to 50 results for performance

  try {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'netra-x-app' // Some APIs require a user-agent
        }
    });

    if (!response.ok) {
      // The API returns 200 even for no results, so any other status is a server error.
      return { success: false, error: `API request failed with status ${response.status}` };
    }

    const responseData = await response.json();
    
    // Validate the response against our schema
    const validation = BreachCompilationResultSchema.safeParse(responseData);
    if (!validation.success) {
      console.error("ProxyNova API response validation error:", validation.error);
      return { success: false, error: 'Failed to parse response from Breach Compilation API.' };
    }
    
    // The API returns a `count` of 0 if nothing is found.
    if(validation.data.count === 0) {
        return { success: true, results: { lines: [], count: 0 } };
    }
    
    return { success: true, results: validation.data };

  } catch (e: any) {
    console.error('Breach Compilation API call failed:', e);
    return { success: false, error: e.message || 'Failed to communicate with the Breach Compilation API.' };
  }
}
