
'use client';

import { useState, useEffect } from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { ClipboardList } from 'lucide-react';

type Task = {
  id: string;
  projectId: string;
  status: 'To Do' | 'In Progress' | 'Completed';
};

const chartConfig = {
  'To Do': { label: 'To Do', color: 'hsl(var(--secondary-foreground))' },
  'In Progress': { label: 'In Progress', color: 'hsl(var(--chart-2))' },
  'Completed': { label: 'Completed', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const COLORS = {
    'To Do': 'hsl(var(--secondary-foreground) / 0.5)',
    'In Progress': 'hsl(var(--chart-2))',
    'Completed': 'hsl(var(--chart-1))',
};

export function TaskStatusChart() {
  const [chartData, setChartData] = useState<{ name: keyof typeof chartConfig; value: number }[]>([]);

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('netra-tasks');
      const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];
      
      const statusCounts = allTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<Task['status'], number>);
      
      const data = Object.entries(statusCounts).map(([name, value]) => ({
        name: name as keyof typeof chartConfig,
        value,
      }));
      setChartData(data);

    } catch (error) {
      console.error('Failed to load task data from localStorage', error);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
            <ClipboardList />
            Task Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
         {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={2}>
                 {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name]}
                    stroke={COLORS[entry.name]}
                  />
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
