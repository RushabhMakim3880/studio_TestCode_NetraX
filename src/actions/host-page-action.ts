
'use server';

import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app as firebaseApp, db } from '@/services/firebase';

/**
 * Saves HTML content to Firestore under a unique ID.
 * @param htmlContent - The HTML string to save.
 * @returns The unique ID for the saved document.
 */
export async function hostPageOnServer(htmlContent: string): Promise<string> {
    if (!db) {
        throw new Error("Firestore is not configured. Cannot host page.");
    }
    
    const pageId = crypto.randomUUID();
    
    try {
        const docRef = doc(db, 'hostedPages', pageId);
        await setDoc(docRef, { 
            htmlContent,
            createdAt: new Date().toISOString(),
        });
        return pageId;
    } catch (error) {
        console.error("Failed to host page on Firestore:", error);
        throw new Error("Could not save the page to the server.");
    }
}
