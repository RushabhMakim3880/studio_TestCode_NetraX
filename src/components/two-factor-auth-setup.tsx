
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { generate2faSecret, verify2faToken } from '@/actions/2fa-actions';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode.react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TwoFactorAuthSetup() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [secret, setSecret] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!user) return null;

    const handleStartSetup = async () => {
        setIsLoading(true);
        try {
            const response = await generate2faSecret(user.username);
            setSecret(response.secret);
            setQrCodeUrl(response.otpauthUrl);
            setIsSetupModalOpen(true);
        } catch(e) {
            toast({ variant: 'destructive', title: "Error", description: "Could not start 2FA setup." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndEnable = async () => {
        setIsLoading(true);
        try {
            const isValid = await verify2faToken({ secret, token: verificationCode });
            if (isValid) {
                updateUser(user.username, { isTwoFactorEnabled: true, twoFactorSecret: secret });
                toast({ title: "2FA Enabled!", description: "Two-Factor Authentication is now active for your account." });
                setIsSetupModalOpen(false);
            } else {
                toast({ variant: "destructive", title: "Verification Failed", description: "The code is incorrect. Please try again." });
            }
        } catch(e) {
            toast({ variant: 'destructive', title: "Error", description: "Could not verify 2FA token." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable2FA = () => {
        updateUser(user.username, { isTwoFactorEnabled: false });
        toast({ title: "2FA Disabled", description: "Two-Factor Authentication has been turned off." });
    };

    return (
        <div className="space-y-4">
            {user.isTwoFactorEnabled ? (
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5" />
                        <p className="font-semibold">2FA is enabled on your account.</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDisable2FA}>Disable 2FA</Button>
                </div>
            ) : (
                 <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5" />
                        <p className="font-semibold">2FA is not enabled.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleStartSetup} disabled={isLoading}>
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Enable 2FA
                    </Button>
                </div>
            )}

            <Dialog open={isSetupModalOpen} onOpenChange={setIsSetupModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
                        <DialogDescription>Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy).</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 flex flex-col items-center gap-4">
                        {qrCodeUrl ? (
                            <div className="p-4 bg-white rounded-lg">
                                <QRCode value={qrCodeUrl} size={200} />
                            </div>
                        ) : (
                            <Loader2 className="h-10 w-10 animate-spin"/>
                        )}
                        <p className="text-sm text-muted-foreground">Or enter this key manually:</p>
                        <Input readOnly value={secret} className="font-mono text-center"/>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="verification-code">Verification Code</label>
                        <Input id="verification-code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Enter 6-digit code" />
                    </div>
                    <DialogFooter>
                         <Button type="button" variant="outline" onClick={() => setIsSetupModalOpen(false)}>Cancel</Button>
                         <Button type="button" onClick={handleVerifyAndEnable} disabled={isLoading || verificationCode.length !== 6}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Verify & Enable
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
