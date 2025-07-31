
'use server';

// This file is deprecated and no longer used.
// Page hosting is now handled client-side via blobs in AdvancedPageCloner.
// This file can be removed in a future cleanup.

/**
 * @deprecated This function is no longer used.
 */
export async function hostTestPage(htmlContent: string): Promise<{ url: string }> {
  console.warn("DEPRECATION WARNING: hostTestPage is deprecated and should not be used.");
  const filename = `${crypto.randomUUID()}`;
  const publicUrl = `/phish/${filename}`;
  return { url: publicUrl };
}
