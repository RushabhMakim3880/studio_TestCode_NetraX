'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import QRCode from 'qrcode.react';

export function QrCodeGenerator({ url }: { url: string }) {
    if (!url) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Shareable QR Code</CardTitle>
                <CardDescription>
                    Use this QR code to easily share the phishing link.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                 <div className="p-4 bg-white rounded-lg">
                   <QRCode
                        value={url}
                        size={180}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
