
'use server';
// This file is deprecated and will be removed. The functionality is now in host-page-action.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    return NextResponse.json({ success: false, error: 'This endpoint is deprecated.' }, { status: 410 });
}
