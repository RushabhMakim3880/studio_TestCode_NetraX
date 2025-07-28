// This file is no longer needed as connection testing for local servers
// is now handled on the client-side.
// Keeping it empty to prevent build errors from old references.
export async function POST() {
    return new Response(JSON.stringify({ message: "This endpoint is deprecated." }), {
        status: 410,
        headers: { "Content-Type": "application/json" },
    });
}
