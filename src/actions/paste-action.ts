
'use server';

import { z } from 'zod';

const PasteRsResponseSchema = z.string();

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
    
    const pasteId = await response.text();
    const validation = PasteRsResponseSchema.safeParse(pasteId);

    if (!validation.success) {
      console.error("paste.rs API response validation error:", validation.error);
      throw new Error('Invalid response received from hosting service.');
    }

    return { success: true, pasteId: validation.data };

  } catch (e: any) {
    console.error('hostOnPasteRs failed:', e);
    return { success: false, error: e.message || 'Failed to communicate with the hosting service.' };
  }
}
