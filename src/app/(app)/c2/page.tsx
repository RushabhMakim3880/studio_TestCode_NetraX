'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getC2Checkins, type C2CheckinOutput } from '@/ai/flows/c2-checkin-flow';
import { runC2Command } from '@/ai/flows/c2-command-flow';
import { Loader2, AlertTriangle, Server, Terminal, Radio, SendHorizontal, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type Agent = C2CheckinOutput['agents'][0];
type TerminalHistoryItem = { type: 'command' | 'output'; content: string };

export default function C2Page() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [terminalHistory, setTerminalHistory] = useState<TerminalHistoryItem[]>([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [isCommandRunning, setIsCommandRunning] = useState(false);
    
    const terminalEndRef = useRef<HTMLDivElement>(null);
    
    const fetchAgents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getC2Checkins();
            setAgents(response.agents);
        } catch (err) {
            setError('Failed to fetch C2 agent data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);
    
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalHistory]);

    const handleInteract = (agent: Agent) => {
        setSelectedAgent(agent);
        setTerminalHistory([]);
        setIsTerminalOpen(true);
    };

    const handleCommandSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCommand || isCommandRunning || !selectedAgent) return;

        setIsCommandRunning(true);
        const commandToRun = currentCommand;
        setTerminalHistory(prev => [...prev, { type: 'command', content: commandToRun }]);
        setCurrentCommand('');
        
        try {
            const response = await runC2Command({
                command: commandToRun,
                os: selectedAgent.os,
            });
            setTerminalHistory(prev => [...prev, { type: 'output', content: response.output }]);
        } catch (err) {
            setTerminalHistory(prev => [...prev, { type: 'output', content: 'Error: Command execution failed on agent.' }]);
            console.error(err);
        } finally {
            setIsCommandRunning(false);
        }
    };
    
    const getOsBadgeVariant = (os: string): 'default' | 'secondary' => {
        if (os.toLowerCase().includes('windows')) return 'default';
        return 'secondary';
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-headline text-3xl font-semibold">C2 Control Panel</h1>
                        <p className="text-muted-foreground">Monitor and interact with simulated C2 agents.</p>
                    </div>
                     <Button onClick={fetchAgents} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Agents
                    </Button>
                </div>
                
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Radio className="h-6 w-6" />
                            <CardTitle>Active Agents</CardTitle>
                        </div>
                        <CardDescription>Simulated implants that have recently checked in.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                        {error && <div className="text-destructive flex items-center justify-center h-64 gap-2"><AlertTriangle className="h-5 w-5" />{error}</div>}
                        {!isLoading && !error && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Agent ID</TableHead>
                                        <TableHead>Hostname</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>IPs (Ext/Int)</TableHead>
                                        <TableHead>OS</TableHead>
                                        <TableHead>Last Seen</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agents.map(agent => (
                                        <TableRow key={agent.agentId}>
                                            <TableCell className="font-mono text-xs">{agent.agentId}</TableCell>
                                            <TableCell>{agent.hostname}</TableCell>
                                            <TableCell>{agent.user}</TableCell>
                                            <TableCell className="font-mono text-xs">{agent.externalIp} / {agent.internalIp}</TableCell>
                                            <TableCell><Badge variant={getOsBadgeVariant(agent.os)}>{agent.os}</Badge></TableCell>
                                            <TableCell>{agent.lastSeen}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleInteract(agent)}>
                                                    <Terminal className="mr-2 h-4 w-4" />
                                                    Interact
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {!isLoading && agents.length === 0 && <p className="text-center text-muted-foreground py-10">No active agents found.</p>}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isTerminalOpen} onOpenChange={setIsTerminalOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Interacting with Agent: {selectedAgent?.agentId}</DialogTitle>
                        <DialogDescription>
                           <span className="font-mono">{selectedAgent?.user}@{selectedAgent?.hostname}</span> ({selectedAgent?.os})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow bg-primary/10 rounded-md p-4 font-mono text-sm overflow-y-auto">
                        <ScrollArea className="h-full">
                            <p className="text-accent">Connection established. Waiting for command...</p>
                            {terminalHistory.map((item, index) => (
                                <div key={index}>
                                    {item.type === 'command' && (
                                        <p><span className="text-accent/80 mr-2">{'>'}</span>{item.content}</p>
                                    )}
                                    {item.type === 'output' && (
                                        <pre className="whitespace-pre-wrap text-muted-foreground">{item.content}</pre>
                                    )}
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </ScrollArea>
                    </div>
                    <DialogFooter>
                        <form onSubmit={handleCommandSubmit} className="w-full flex gap-2">
                            <Input 
                                placeholder="Enter command (e.g., whoami, ls, ps)..."
                                className="font-mono"
                                value={currentCommand}
                                onChange={e => setCurrentCommand(e.target.value)}
                                disabled={isCommandRunning}
                                autoFocus
                            />
                            <Button type="submit" disabled={isCommandRunning}>
                                {isCommandRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4"/>}
                                <span className="sr-only">Send Command</span>
                            </Button>
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
