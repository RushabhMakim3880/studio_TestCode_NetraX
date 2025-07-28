
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { useMemo } from 'react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import type { Project } from '@/app/(app)/project-management/page';

type GanttChartProps = {
  projects: Project[];
};

type ChartDataItem = {
  name: string;
  range: [number, number];
  duration: number;
};

export function ProjectGanttChart({ projects }: GanttChartProps) {
  const { chartData, domain } = useMemo(() => {
    if (projects.length === 0) {
      return { chartData: [], domain: [0, 0] };
    }

    const allDates = projects.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
    const timelineStart = startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const timelineEnd = startOfDay(new Date(Math.max(...allDates.map(d => d.getTime()))));
    
    const totalDays = differenceInDays(timelineEnd, timelineStart);

    const data: ChartDataItem[] = projects.map(project => {
      const start = differenceInDays(startOfDay(new Date(project.startDate)), timelineStart);
      const end = differenceInDays(startOfDay(new Date(project.endDate)), timelineStart);
      return {
        name: project.name,
        range: [start, end],
        duration: end - start + 1, // +1 to include the end day
      };
    });

    return { chartData: data, domain: [0, totalDays] };
  }, [projects]);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const project = projects.find(p => p.name === data.name);
      return (
        <div className="bg-popover p-2 border rounded-md shadow-lg text-popover-foreground text-sm">
          <p className="font-bold">{data.name}</p>
          <p>Start: {project ? format(new Date(project.startDate), 'MMM d, yyyy') : 'N/A'}</p>
          <p>End: {project ? format(new Date(project.endDate), 'MMM d, yyyy') : 'N/A'}</p>
          <p>Duration: {data.duration} days</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="h-[calc(80vh)] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={domain} tickFormatter={(tick) => format(new Date(domain[0] + tick * 86400000), 'MMM d')} />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}/>
                <Bar dataKey="range" barSize={20} className="fill-accent" />
            </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
