
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
import { useAuth, type User } from '@/hooks/use-auth';
import { Users, User as UserIcon } from 'lucide-react';
import { ROLES } from '@/lib/constants';

const chartConfig = {
  [ROLES.ADMIN]: { label: 'Admin', color: 'hsl(var(--chart-1))' },
  [ROLES.ANALYST]: { label: 'Analyst', color: 'hsl(var(--chart-2))' },
  [ROLES.OPERATOR]: { label: 'Operator', color: 'hsl(var(--chart-3))' },
  [ROLES.AUDITOR]: { label: 'Auditor', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig;

export function UserRoleChart() {
  const { users } = useAuth();
  const [chartData, setChartData] = useState<{ name: keyof typeof chartConfig; value: number; fill: string; }[]>([]);

  useEffect(() => {
    if (users.length > 0) {
      const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<User['role'], number>);
      
      const data = Object.entries(roleCounts).map(([name, value]) => ({
        name: name as keyof typeof chartConfig,
        value,
        fill: chartConfig[name as keyof typeof chartConfig].color,
      }));
      setChartData(data);
    }
  }, [users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
            <Users />
            User Roles
        </CardTitle>
         <CardDescription>Breakdown of users by assigned role.</CardDescription>
      </CardHeader>
      <CardContent>
         {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={2}>
                 {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        ) : (
             <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-center">
                <UserIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm">No user data available.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
