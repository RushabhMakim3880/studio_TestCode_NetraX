
// This file is deprecated and no longer used.
// The new C2 logic is handled in the /api/c2/telegram/webhook/[token]/route.ts file
// which provides a more secure and robust webhook implementation.
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ error: 'This endpoint is deprecated.' }, { status: 410 });
}
