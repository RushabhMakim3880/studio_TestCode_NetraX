
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app as firebaseApp } from '@/services/firebase';

// This route serves the hosted phishing pages.
// It fetches the HTML content from Firestore based on the ID in the URL.

export const revalidate = 0; // Ensure fresh data on every request

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    try {
        const db = getFirestore(firebaseApp!);
        const docRef = doc(db, 'hostedPages', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const htmlContent = docSnap.data().htmlContent;
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
            console.warn(`Phishing page with ID not found: ${id}`);
            // Return a generic 404 to avoid leaking information about valid/invalid IDs
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error(`Error fetching phishing page ${id}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
