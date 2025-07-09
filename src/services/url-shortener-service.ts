
'use server';

import { z } from 'zod';

const ShortUrlResponseSchema = z.object({
  success: z.boolean(),
  shortUrl: z.string().url().optional(),
  error: z.string().optional(),
});

type ShortUrlResponse = z.infer<typeof ShortUrlResponseSchema>;

/**
 * Shortens a long URL using the TinyURL API.
 * @param longUrl The URL to shorten.
 * @returns A promise that resolves to an object containing the shortened URL or an error.
 */
export async function shortenUrl(longUrl: string): Promise<ShortUrlResponse> {
  const apiKey = process.env.TINYURL_API_KEY;
  const apiUrl = 'https://api.tinyurl.com/create';

  if (!apiKey) {
    const helpfulError = 'TinyURL API key is not configured. Please add TINYURL_API_KEY to your .env file.';
    console.error(helpfulError);
    return { success: false, error: helpfulError };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: longUrl,
        domain: 'tiny.one' // Use a generic domain
      }),
    });

    const data = await response.json();

    if (!response.ok || data.code !== 0) {
      const errorMessage = data.errors?.join(', ') || 'Failed to create short URL.';
      console.error('TinyURL API Error:', errorMessage);
      return { success: false, error: errorMessage };
    }

    return { success: true, shortUrl: data.data.tiny_url };

  } catch (error) {
    console.error('Error calling TinyURL API:', error);
    if (error instanceof Error) {
      return { success: false, error: `Network error: ${error.message}` };
    }
    return { success: false, error: 'An unknown error occurred while shortening the URL.' };
  }
}
