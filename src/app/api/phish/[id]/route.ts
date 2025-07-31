
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

// This is a dynamic route handler.
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        console.warn("Phishing page request missing ID.");
        return new NextResponse('Missing page ID.', { status: 400 });
    }
    
    if (!db) {
        return new NextResponse('Database service is not configured on the server.', { status: 500 });
    }

    try {
        const docRef = doc(db, "hostedPages", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const htmlContent = docSnap.data()?.htmlContent || '';
            return new NextResponse(htmlContent, {
                status: 200,
                headers: { 
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
        } else {
             return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error(`Error serving page ${id}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
