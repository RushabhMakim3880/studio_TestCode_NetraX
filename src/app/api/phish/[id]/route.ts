
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app as firebaseApp, db } from '@/services/firebase';

// This route serves the hosted phishing pages.
// It fetches the HTML content from Firestore based on the ID in the URL.

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        console.warn("Phishing page request missing ID.");
        return new NextResponse('Missing page ID.', { status: 400 });
    }

    if (!db) {
        console.error("Firestore is not initialized. Cannot serve phishing page.");
        return new NextResponse('Server configuration error.', { status: 500 });
    }

    try {
        const docRef = doc(db, 'hostedPages', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const htmlContent = docSnap.data().htmlContent;
            if (typeof htmlContent !== 'string') {
                 console.error(`Firestore document for page ID ${id} is missing 'htmlContent' field.`);
                 return new NextResponse('Invalid page content.', { status: 500 });
            }
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
            console.warn(`Phishing page with ID not found in Firestore: ${id}`);
            // Return a generic 404 to avoid leaking information about valid/invalid IDs
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error(`Error fetching phishing page ${id}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
