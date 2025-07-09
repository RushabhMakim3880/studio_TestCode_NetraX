'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QRCode from 'qrcode.react';
import { useState } from 'react';

export function QrCodeGenerator() {
    const [url, setUrl] = useState('');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sharing Options</CardTitle>
                <CardDescription>
                    Download the HTML file, host it on a public server, then paste the URL below to generate a shareable QR code.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                 <div className="w-full space-y-2">
                    <Label htmlFor="hosting-url">Your Hosted URL</Label>
                    <Input
                        id="hosting-url"
                        placeholder="https://your-phishing-domain.com/login.html"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                 </div>
                 {url && (
                    <div className="p-4 bg-white rounded-lg">
                       <QRCode
                            value={url}
                            size={180}
                            level={"H"}
                            includeMargin={true}
                        />
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
