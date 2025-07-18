
'use client';

import { useState, useEffect } from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { ClipboardList } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

type Task = {
  id: string;
  projectId: string;
  status: 'To Do' | 'In Progress' | 'Completed';
};

const chartConfig = {
  'To Do': { label: 'To Do', color: 'hsl(var(--chart-3))' },
  'In Progress': { label: 'In Progress', color: 'hsl(var(--chart-2))' },
  'Completed': { label: 'Completed', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

export function TaskStatusChart() {
  const [chartData, setChartData] = useState<{ name: keyof typeof chartConfig; value: number; fill: string; }[]>([]);
  const { value: allTasks } = useLocalStorage<Task[]>('netra-tasks', []);

  useEffect(() => {
    if (allTasks.length > 0) {
        const statusCounts = allTasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<Task['status'], number>);
        
        const data = Object.entries(statusCounts).map(([name, value]) => ({
            name: name as keyof typeof chartConfig,
            value,
            fill: chartConfig[name as keyof typeof chartConfig].color,
        }));
        setChartData(data);
    } else {
        setChartData([]);
    }
  }, [allTasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
            <ClipboardList />
            Task Status
        </CardTitle>
        <CardDescription>Distribution of all tasks by status.</CardDescription>
      </CardHeader>
      <CardContent>
         {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={2}>
                 {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No task data available.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
