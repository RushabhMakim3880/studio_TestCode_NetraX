
'use client';

import { TelegramC2Control } from '@/components/telegram-c2-control';
import { TelegramSetupGuide } from '@/components/telegram-setup-guide';

export default function C2Page() {

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="font-headline text-3xl font-semibold">Telegram C2 Panel</h1>
                <p className="text-muted-foreground">Use Telegram for command and control, payload delivery, and data exfiltration.</p>
            </div>
            
            <TelegramSetupGuide />
            <TelegramC2Control />
        </div>
    );
}
