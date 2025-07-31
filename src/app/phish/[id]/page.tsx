
'use client';

// This entire page and route is deprecated.
// The logic for handling phishing pages created via the "Phishing" module
// has been moved to a client-side blob URL generation method within the
// AdvancedPageCloner component. This server-side route is no longer needed.

import { notFound } from 'next/navigation';
import { useEffect } from 'react';

export default function DeprecatedPhishingPage() {
    useEffect(() => {
        notFound();
    }, []);
    return null;
}
