
'use server';

import { z } from 'zod';

const ReturnSchema = z.object({
  success: z.boolean(),
  pasteId: z.string().optional(),
  error: z.string().optional(),
});
type ReturnType = z.infer<typeof ReturnSchema>;

export async function hostOnPasteRs(htmlContent: string): Promise<ReturnType> {
  try {
    const response = await fetch('https://paste.rs', {
        method: 'POST',
        body: htmlContent,
        headers: { 'Content-Type': 'text/html' }
    });
    
    if (!response.ok) {
        throw new Error(`paste.rs service responded with status: ${response.status}`);
    }
    
    // The response from paste.rs is the full URL as a text string, e.g., "https://paste.rs/S4IzJ"
    const responseUrl = await response.text();
    
    // Extract only the ID part from the URL.
    const pasteId = responseUrl.split('/').pop();

    if (!pasteId || pasteId.trim() === '') {
        console.error('Could not parse the paste ID from the response URL:', responseUrl);
        throw new Error('Could not parse the paste ID from the response URL.');
    }

    return { success: true, pasteId: pasteId };

  } catch (e: any) {
    console.error('hostOnPasteRs failed:', e);
    return { success: false, error: e.message || 'Failed to communicate with the hosting service.' };
  }
}
