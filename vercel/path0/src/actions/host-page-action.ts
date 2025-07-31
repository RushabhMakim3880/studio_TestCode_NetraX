
'use server';

import { db } from '@/services/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Saves HTML content to a Firestore document.
 * This is a robust method for Vercel's serverless environment.
 * @param htmlContent - The HTML string to save.
 * @returns The unique ID for the saved Firestore document.
 */
export async function hostPageOnServer(htmlContent: string): Promise<string> {
    if (!htmlContent) {
        throw new Error('No HTML content provided.');
    }
    
    if (!db) {
        throw new Error('Firebase Firestore is not configured on the server. Cannot host page.');
    }

    try {
        const docRef = await addDoc(collection(db, "hostedPages"), {
            htmlContent: htmlContent,
            createdAt: serverTimestamp(),
        });

        return docRef.id;

    } catch (error) {
        console.error("Failed to host page on Firestore:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Could not save the page to the database: ${message}`);
    }
}
