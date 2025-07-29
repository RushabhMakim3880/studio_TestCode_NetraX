
'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Award, FolderSearch } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAuth, type User } from '@/hooks/use-auth';

type Task = {
  id: string;
  projectId: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  assignedTo?: string; // username
};

type ChartData = {
  name: string;
  tasksCompleted: number;
};

const chartConfig = {
  tasksCompleted: {
    label: 'Tasks Completed',
    color: 'hsl(var(--chart-1))',
  },
};

export function UserPerformanceChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const { value: allTasks } = useLocalStorage<Task[]>('netra-tasks', []);
  const { users: teamMembers } = useAuth();

  useEffect(() => {
    if (allTasks.length === 0 || teamMembers.length === 0) {
      setChartData([]);
      return;
    }

    const completedTasks = allTasks.filter(t => t.status === 'Completed' && t.assignedTo);

    const performanceData = completedTasks.reduce((acc, task) => {
      if (task.assignedTo) {
        acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const data: ChartData[] = Object.entries(performanceData).map(([username, count]) => {
      const user = teamMembers.find(u => u.username === username);
      return {
        name: user?.displayName || username,
        tasksCompleted: count,
      };
    }).sort((a,b) => b.tasksCompleted - a.tasksCompleted); // Sort descending
    
    setChartData(data);

  }, [allTasks, teamMembers]);

  return (
    <Card className="flex-grow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5" />
          <CardTitle className="text-lg">User Performance</CardTitle>
        </div>
        <CardDescription>A summary of completed tasks by team members.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 20 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-xs"
              />
              <YAxis hide/>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="tasksCompleted" fill="var(--color-chart-1)" radius={4}>
                 <LabelList
                    dataKey="tasksCompleted"
                    position="top"
                    offset={8}
                    className="fill-foreground text-sm"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="text-center text-muted-foreground py-10 h-[250px] flex flex-col items-center justify-center">
            <FolderSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p>No completed tasks to display.</p>
            <p className="text-sm">Complete some tasks in Project Management to see performance data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
