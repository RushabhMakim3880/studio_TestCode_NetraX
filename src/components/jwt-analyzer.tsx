
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, KeySquare, Loader2, ShieldAlert, ShieldCheck, ShieldClose, ShieldQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64url';

type JwtPart = {
    decoded: object;
    raw: string;
};

const commonSecrets = ['secret', 'password', '123456', 'admin', 'root', 'jwt', 'token', 'secretkey'];

export function JwtAnalyzer() {
    const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJpc0FkbWluIjp0cnVlfQ.4iEWp-K1JMSi_50pDkP0dM0_8SgA4i-1ZqgHqw7zZPY');
    const [header, setHeader] = useState<JwtPart | null>(null);
    const [payload, setPayload] = useState<JwtPart | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [secret, setSecret] = useState('secret');
    const [verificationStatus, setVerificationStatus] = useState<'valid' | 'invalid' | 'alg_none' | 'unchecked'>('unchecked');
    const [bruteForceResult, setBruteForceResult] = useState<string | null>(null);
    const [isBruteForcing, setIsBruteForcing] = useState(false);
    
    const { toast } = useToast();

    const base64UrlEncode = (str: string) => {
        return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const base64UrlDecode = (str: string) => {
        try {
            const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            const padLength = (4 - base64.length % 4) % 4;
            const padded = base64 + '='.repeat(padLength);
            return decodeURIComponent(escape(atob(padded)));
        } catch(e) {
            console.error("Base64Url Decode Error:", e);
            return "Invalid Base64Url string";
        }
    };

    useEffect(() => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                setHeader(null);
                setPayload(null);
                setSignature(null);
                setVerificationStatus('invalid');
                return;
            }
            
            const newHeader = JSON.parse(base64UrlDecode(parts[0]));
            const newPayload = JSON.parse(base64UrlDecode(parts[1]));
            
            setHeader({ decoded: newHeader, raw: parts[0] });
            setPayload({ decoded: newPayload, raw: parts[1] });
            setSignature(parts[2]);
            
            verifyToken(parts[0], parts[1], parts[2], secret, newHeader.alg);

        } catch (e) {
            setHeader(null);
            setPayload(null);
            setSignature(null);
        }
    }, [token, secret]);
    
    const verifyToken = (headerRaw: string, payloadRaw: string, signatureRaw: string, key: string, alg: string) => {
         if (alg.toLowerCase() === 'none') {
            setVerificationStatus('alg_none');
            return;
        }
        if (alg.toUpperCase() !== 'HS256') {
            setVerificationStatus('unchecked'); // Can't verify non-HS256 in this tool
            return;
        }

        const dataToSign = `${headerRaw}.${payloadRaw}`;
        const newSignature = Base64.stringify(HmacSHA256(dataToSign, key));

        setVerificationStatus(newSignature === signatureRaw ? 'valid' : 'invalid');
    };

    const handlePartChange = (part: 'header' | 'payload', value: string) => {
        try {
            const newDecoded = JSON.parse(value);
            const newRaw = base64UrlEncode(JSON.stringify(newDecoded));

            const newHeaderRaw = part === 'header' ? newRaw : header?.raw || '';
            const newPayloadRaw = part === 'payload' ? newRaw : payload?.raw || '';

            const dataToSign = `${newHeaderRaw}.${newPayloadRaw}`;
            const newSignature = Base64.stringify(HmacSHA256(dataToSign, secret));

            setToken(`${newHeaderRaw}.${newPayloadRaw}.${newSignature}`);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The content of the header or payload is not valid JSON.' });
        }
    };
    
    const handleAlgNone = () => {
        if (!header || !payload) return;
        const newHeader = {...header.decoded, alg: 'none'};
        const newHeaderRaw = base64UrlEncode(JSON.stringify(newHeader));
        setToken(`${newHeaderRaw}.${payload.raw}.`);
        toast({ title: "alg=none Applied", description: "Signature has been removed." });
    };

    const handleBruteForce = () => {
        if (!header || !payload || !signature) return;
        setIsBruteForcing(true);
        setBruteForceResult(null);

        setTimeout(() => {
            let foundKey: string | null = null;
            for (const key of commonSecrets) {
                const dataToSign = `${header.raw}.${payload.raw}`;
                const newSignature = Base64.stringify(HmacSHA256(dataToSign, key));
                if (newSignature === signature) {
                    foundKey = key;
                    break;
                }
            }
            setIsBruteForcing(false);
            setBruteForceResult(foundKey);
        }, 500); // Simulate async work
    }


    const StatusBadge = () => {
        switch(verificationStatus) {
            case 'valid': return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30"><ShieldCheck className="mr-2 h-4 w-4"/>Signature Verified</Badge>;
            case 'invalid': return <Badge variant="destructive"><ShieldClose className="mr-2 h-4 w-4"/>Invalid Signature</Badge>;
            case 'alg_none': return <Badge variant="secondary"><ShieldAlert className="mr-2 h-4 w-4 text-amber-400"/>alg=none (No Signature)</Badge>;
            default: return <Badge variant="outline"><ShieldQuestion className="mr-2 h-4 w-4"/>Cannot Verify (alg is not HS256)</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <KeySquare className="h-6 w-6" />
                    <CardTitle>JWT Analyzer & Manipulator</CardTitle>
                </div>
                <CardDescription>Decode, verify, manipulate, and test JSON Web Tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="jwt-input">Encoded Token</Label>
                    <Textarea id="jwt-input" value={token} onChange={(e) => setToken(e.target.value)} className="font-mono" />
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="jwt-header">Header</Label>
                        <Textarea id="jwt-header" value={header ? JSON.stringify(header.decoded, null, 2) : ''} onChange={(e) => handlePartChange('header', e.target.value)} className="font-mono h-32 bg-primary/20" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="jwt-payload">Payload</Label>
                        <Textarea id="jwt-payload" value={payload ? JSON.stringify(payload.decoded, null, 2) : ''} onChange={(e) => handlePartChange('payload', e.target.value)} className="font-mono h-32 bg-primary/20" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="jwt-secret">HMAC Secret Key (for HS256)</Label>
                        <Input id="jwt-secret" value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono" />
                        <div className="flex items-center justify-center p-3 rounded-md bg-primary/20"><StatusBadge /></div>
                    </div>
                </div>

                <Card className="bg-primary/20">
                    <CardHeader>
                        <CardTitle className="text-base">Security Checks</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <Button onClick={handleAlgNone} variant="outline" className="w-full">Apply alg=none Bypass</Button>
                             <p className="text-xs text-muted-foreground mt-2">Removes the signature, a common misconfiguration bypass.</p>
                        </div>
                        <div>
                            <Button onClick={handleBruteForce} variant="outline" className="w-full" disabled={isBruteForcing}>
                                {isBruteForcing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Brute-force HS256 Secret
                            </Button>
                             {bruteForceResult !== null && (
                                bruteForceResult ? (
                                    <div className="mt-2 text-sm text-green-400 flex items-center gap-2"><CheckCircle className="h-4 w-4"/>Secret Found: <span className="font-mono text-accent">{bruteForceResult}</span></div>
                                ) : (
                                    <div className="mt-2 text-sm text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Secret not in common list.</div>
                                )
                             )}
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}
