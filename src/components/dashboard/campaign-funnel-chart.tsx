
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Filter, Mail, MousePointerClick, ShieldX } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { SentEmail } from '../email-outbox';
import type { TrackedEvent } from '../live-tracker';

export function CampaignFunnelChart() {
    const { value: sentEmails } = useLocalStorage<SentEmail[]>('netra-email-outbox', []);
    const { value: sessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});

    const funnelData = {
        sent: sentEmails.length,
        clicked: Object.values(sessions).filter(events => events.some(e => e.type === 'click')).length,
        compromised: Object.values(sessions).filter(events => events.some(e => e.type === 'form-submit')).length,
    };

    const maxVal = Math.max(funnelData.sent, 1); // Avoid division by zero

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                    <Filter />
                    Phishing Campaign Funnel
                </CardTitle>
                <CardDescription className="text-xs">A high-level overview of campaign effectiveness.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <FunnelStage icon={Mail} label="Emails Sent" value={funnelData.sent} percentage={100} color="bg-sky-500" />
                    <FunnelStage icon={MousePointerClick} label="Links Clicked" value={funnelData.clicked} percentage={maxVal > 0 ? (funnelData.clicked / maxVal) * 100 : 0} color="bg-amber-500" />
                    <FunnelStage icon={ShieldX} label="Credentials Compromised" value={funnelData.compromised} percentage={maxVal > 0 ? (funnelData.compromised / maxVal) * 100 : 0} color="bg-red-500" />
                </div>
            </CardContent>
        </Card>
    );
}

const FunnelStage = ({ icon: Icon, label, value, percentage, color }: { icon: React.ElementType, label: string, value: number, percentage: number, color: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /> {label}</span>
            <span className="font-bold">{value}</span>
        </div>
        <div className="w-full bg-primary/30 rounded-full h-4">
            <div
                className={`${color} h-4 rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    </div>
)
