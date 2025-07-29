
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GitBranch, FolderSearch } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';
import type { Task } from '@/app/(app)/project-management/page';

const MITRE_TACTICS = [
  { id: 'TA0001', name: 'Recon' },
  { id: 'TA0002', name: 'Dev' },
  { id: 'TA0003', name: 'Access' },
  { id: 'TA0004', name: 'Escalate' },
  { id: 'TA0005', name: 'Defense' },
  { id: 'TA0006', name: 'Creds' },
  { id: 'TA0007', name: 'Discover' },
  { id: 'TA0008', name: 'Lateral' },
  { id: 'TA0009', name: 'Collect' },
  { id: 'TA0011', name: 'C2' },
  { id: 'TA0010', name: 'Exfil' },
  { id: 'TA0040', name: 'Impact' },
];

export function MitreAttackHeatmap() {
    const { value: allTasks } = useLocalStorage<Task[]>('netra-tasks', []);
    const [ttpCounts, setTtpCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const counts: Record<string, number> = {};
        allTasks.forEach(task => {
            if (task.mitreTtp) {
                const ttps = task.mitreTtp.split(',').map(t => t.trim());
                ttps.forEach(ttp => {
                    counts[ttp] = (counts[ttp] || 0) + 1;
                });
            }
        });
        setTtpCounts(counts);
    }, [allTasks]);
    
    const maxCount = Math.max(...Object.values(ttpCounts), 0);

    const getTacticFromTtp = (ttp: string) => {
        // This is a placeholder. A real implementation would map TTPs to tactics.
        const ttpNum = parseInt(ttp.substring(1), 10);
        if (ttpNum >= 1580) return 'TA0001';
        if (ttpNum >= 1560) return 'TA0002';
        if (ttpNum >= 1070) return 'TA0003';
        return 'TA0005';
    };

    const cellsByTactic = MITRE_TACTICS.map(tactic => {
        const tacticTtps = Object.keys(ttpCounts).filter(ttp => getTacticFromTtp(ttp) === tactic.id);
        return { tactic, ttps: tacticTtps };
    });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
            <GitBranch />
            MITRE ATT&CK Heatmap
        </CardTitle>
        <CardDescription className="text-xs">Visualizes the frequency of ATT&CK techniques used across all projects.</CardDescription>
      </CardHeader>
      <CardContent>
          {Object.keys(ttpCounts).length > 0 ? (
                <div className="flex gap-1">
                    {cellsByTactic.map(({ tactic, ttps }) => (
                        <div key={tactic.id} className="flex flex-col gap-1 flex-1">
                            <div className="text-center text-xs font-bold text-muted-foreground">{tactic.name}</div>
                            {ttps.map(ttp => {
                                const count = ttpCounts[ttp];
                                const opacity = maxCount > 0 ? 0.2 + (count / maxCount) * 0.8 : 0.2;
                                return (
                                    <TooltipProvider key={ttp}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div 
                                                    className="h-4 rounded-sm bg-accent"
                                                    style={{ opacity }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{ttp}: Used {count} time(s)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )
                            })}
                        </div>
                    ))}
                </div>
          ) : (
                <div className="text-center text-muted-foreground py-6 h-[100px] flex flex-col items-center justify-center">
                    <FolderSearch className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm">No TTPs logged in tasks.</p>
                </div>
          )}
      </CardContent>
    </Card>
  );
}
