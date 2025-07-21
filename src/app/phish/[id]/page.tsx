
'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

// This page is responsible for rendering the phishing content.
export default function PhishingRenderPage({ params }: { params: { id: string } }) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // This logic is now safely inside a useEffect, ensuring it only runs on the client
    // after the initial render, preventing hydration mismatches.
    if (params.id) {
      try {
        const storedHtml = localStorage.getItem(`phishing-html-${params.id}`);
        if (storedHtml) {
          setHtmlContent(storedHtml);
        } else {
          // If no content is found for this ID, mark as an error to trigger notFound().
          setError(true);
        }
      } catch (e) {
        console.error("Failed to read phishing page content from localStorage", e);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    } else {
        setIsLoading(false);
        setError(true);
    }
  }, [params.id]);

  useEffect(() => {
    // This effect runs only when htmlContent is successfully set.
    if (htmlContent) {
      document.open();
      document.write(htmlContent);
      document.close();
    }
  }, [htmlContent]);
  
  if (error && !isLoading) {
      // If an error occurred (e.g., page not found in localStorage), trigger a 404.
      notFound();
  }

  // Display a loading indicator while fetching from localStorage.
  // This will be replaced by the document.write call.
  return (
    <div id="phish-root" style={{
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        margin: 0,
        backgroundColor: '#111',
        color: '#eee'
    }}>
        <div style={{
            border: '4px solid #444',
            borderTop: '4px solid #79ffef',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1.5s linear infinite'
        }} />
        <p style={{ marginTop: '20px' }}>Loading content...</p>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
  );
}
