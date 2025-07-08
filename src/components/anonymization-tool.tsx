'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Shield, Waypoints, Plus, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { simulateConnection, type AnonymizerOutput } from '@/ai/flows/anonymizer-flow';
import { useToast } from '@/hooks/use-toast';

const vpnCountries = ['United States', 'Germany', 'Russia', 'Netherlands', 'Singapore', 'Brazil'];
const proxyTypes = ['HTTP', 'SOCKS4', 'SOCKS5'];
const proxyCountries = ['United States', 'Canada', 'United Kingdom', 'France', 'Japan', 'Australia', 'India'];

type ProxyHop = {
    id: string;
    country: string;
    type: string;
};

export function AnonymizationTool() {
    const [vpn, setVpn] = useState<string | undefined>(undefined);
    const [proxyChain, setProxyChain] = useState<ProxyHop[]>([]);
    const [result, setResult] = useState<AnonymizerOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const addProxyHop = () => {
        if (proxyChain.length >= 5) {
            toast({ variant: 'destructive', title: 'Chain Limit Reached', description: 'Maximum of 5 proxy hops is allowed.' });
            return;
        }
        setProxyChain([...proxyChain, { id: crypto.randomUUID(), country: 'United States', type: 'HTTP' }]);
    };

    const removeProxyHop = (id: string) => {
        setProxyChain(proxyChain.filter(p => p.id !== id));
    };

    const updateProxyHop = (id: string, field: 'country' | 'type', value: string) => {
        setProxyChain(proxyChain.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    
    const moveProxyHop = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === proxyChain.length - 1) return;

        const newChain = [...proxyChain];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newChain[index], newChain[targetIndex]] = [newChain[targetIndex], newChain[index]];
        setProxyChain(newChain);
    };

    const handleConnect = async () => {
        if (!vpn && proxyChain.length === 0) {
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'Please select a VPN or add at least one proxy hop.' });
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const response = await simulateConnection({
                vpnExitCountry: vpn,
                proxyChain: proxyChain.map(({ id, ...rest }) => rest), // remove client-side id before sending
            });
            setResult(response);
        } catch (err) {
            setError('Failed to simulate connection. The AI may have refused the request.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!' });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6" />
                    <CardTitle>Anonymization Chain Simulator</CardTitle>
                </div>
                <CardDescription>Configure a simulated VPN and proxy chain to anonymize your traffic.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <Label>1. VPN Configuration (Optional)</Label>
                        <Select onValueChange={(v) => setVpn(v === 'none' ? undefined : v)} value={vpn}>
                            <SelectTrigger><SelectValue placeholder="Select VPN Exit Country..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No VPN</SelectItem>
                                {vpnCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>2. Proxy Chain Builder</Label>
                            <Button size="sm" variant="outline" onClick={addProxyHop}><Plus className="mr-2 h-4 w-4" /> Add Hop</Button>
                        </div>
                        <div className="space-y-2 p-2 border rounded-md min-h-[100px] bg-primary/10">
                            {proxyChain.length === 0 && <p className="text-sm text-center text-muted-foreground p-4">No proxy hops configured.</p>}
                            {proxyChain.map((hop, index) => (
                                <div key={hop.id} className="flex items-center gap-2 p-2 rounded bg-card border">
                                    <Waypoints className="h-5 w-5 text-muted-foreground shrink-0" />
                                    <div className="flex-grow grid grid-cols-2 gap-2">
                                        <Select value={hop.country} onValueChange={v => updateProxyHop(hop.id, 'country', v)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {proxyCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={hop.type} onValueChange={v => updateProxyHop(hop.id, 'type', v)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {proxyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col">
                                       <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveProxyHop(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button> 
                                       <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveProxyHop(index, 'down')} disabled={index === proxyChain.length - 1}><ArrowDown className="h-4 w-4" /></Button> 
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeProxyHop(hop.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <Button onClick={handleConnect} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                        Simulate Connection
                    </Button>
                </div>

                 <div className="space-y-4">
                    <Label>Connection Status & Log</Label>
                    <div className="h-full min-h-[300px] border rounded-md bg-primary/20 p-4 space-y-4">
                        {isLoading && <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                        {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
                        {!isLoading && !result && <div className="text-muted-foreground text-center h-full flex flex-col items-center justify-center">Connection status will appear here.</div>}
                        
                        {result && (
                            <div className="space-y-4 animate-in fade-in">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>New Public IP Address</CardDescription>
                                        <CardTitle className="flex items-center justify-between font-mono">
                                            {result.newPublicIp}
                                            <Button variant="ghost" size="icon" onClick={() => handleCopy(result.newPublicIp)}><Copy className="h-4 w-4" /></Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">Exit Country: {result.finalCountry}</p>
                                    </CardContent>
                                </Card>
                                <div>
                                    <Label>Connection Log</Label>
                                    <pre className="mt-1 font-mono text-xs bg-card p-3 rounded-md max-h-60 overflow-y-auto">{result.connectionLog}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
