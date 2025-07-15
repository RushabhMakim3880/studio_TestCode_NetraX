
'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

// This page is responsible for rendering the phishing content.
export default function PhishingRenderPage({ params }: { params: { id: string } }) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && params.id) {
      try {
        // Retrieve the stored HTML from localStorage using the ID from the URL.
        const storedHtml = localStorage.getItem(`phishing-html-${params.id}`);
        if (storedHtml) {
          setHtmlContent(storedHtml);
        } else {
          // If no content is found for this ID, it's a 404.
          setHtmlContent(null);
        }
      } catch (error) {
        console.error("Failed to read phishing page content from localStorage", error);
        setHtmlContent(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [params.id]);

  useEffect(() => {
    // If content is loaded, inject it into the document.
    if (htmlContent) {
      document.open();
      document.write(htmlContent);
      document.close();
    }
  }, [htmlContent]);
  
  if (!isLoading && !htmlContent) {
      // If after loading there's no content, show a proper 404.
      notFound();
  }

  // Display a loading indicator while fetching from localStorage.
  return (
    <html>
        <head>
            <title>Loading...</title>
             <style>
                body { font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #111; color: #eee; }
                .loader { border: 4px solid #444; border-top: 4px solid #79ffef; border-radius: 50%; width: 50px; height: 50px; animation: spin 1.5s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body>
            <div className="loader"></div>
            <p style={{ marginTop: '20px' }}>Loading content...</p>
        </body>
    </html>
  );
}
