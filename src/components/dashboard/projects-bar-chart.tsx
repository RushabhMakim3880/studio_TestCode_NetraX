
'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Briefcase, FolderSearch } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

type Project = {
  id: string;
  name: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
};

type Task = {
  id: string;
  projectId: string;
  status: 'To Do' | 'In Progress' | 'Completed';
};

type ChartData = {
  name: string;
  progress: number;
};

const chartConfig = {
  progress: {
    label: 'Progress',
    color: 'hsl(var(--chart-1))',
  },
};

export function ProjectsBarChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const { value: allProjects } = useLocalStorage<Project[]>('netra-projects', []);
  const { value: allTasks } = useLocalStorage<Task[]>('netra-tasks', []);

  useEffect(() => {
    const activeProjects = allProjects.filter((p: Project) => p.status === 'Active');

    const data: ChartData[] = activeProjects.map(project => {
      const projectTasks = allTasks.filter(t => t.projectId === project.id);
      if (projectTasks.length === 0) return { name: project.name, progress: 0 };
      const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
      const progress = Math.round((completedTasks / projectTasks.length) * 100);
      return { name: project.name, progress };
    });
    
    setChartData(data);

  }, [allProjects, allTasks]);

  return (
    <Card className="flex-grow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5" />
          <CardTitle className="text-lg">Active Project Progress</CardTitle>
        </div>
        <CardDescription>A summary of progress for all ongoing projects.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 10, right: 40 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-xs"
                width={120}
              />
              <XAxis dataKey="progress" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="progress" layout="vertical" fill="var(--color-chart-1)" radius={4}>
                 <LabelList
                    dataKey="progress"
                    position="right"
                    offset={8}
                    className="fill-foreground text-sm"
                    formatter={(value: number) => `${value}%`}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="text-center text-muted-foreground py-10 h-[250px] flex flex-col items-center justify-center">
            <FolderSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p>No active projects to display.</p>
            <p className="text-sm">Start a new project in the Project Management module.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
