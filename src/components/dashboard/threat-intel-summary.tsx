
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rss, AlertTriangle, Loader2 } from 'lucide-react';
import { getRecentCves, type CveData } from '@/services/cve-service';
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type SeverityCounts = {
  Critical: number;
  High: number;
  Medium: number;
};

const getSeverity = (score: number): keyof SeverityCounts | 'Low' | 'None' => {
  if (score >= 9.0) return 'Critical';
  if (score >= 7.0) return 'High';
  if (score >= 4.0) return 'Medium';
  if (score > 0) return 'Low';
  return 'None';
};

const chartConfig = {
  count: {
    label: "CVEs",
  },
  Critical: {
    label: "Critical",
    color: "hsl(var(--destructive))",
  },
  High: {
    label: "High",
    color: "hsl(var(--chart-4))",
  },
  Medium: {
    label: "Medium",
    color: "hsl(var(--chart-2))",
  },
} satisfies import("recharts").BarProps & { label: string, color: string };


export function ThreatIntelSummary() {
  const [chartData, setChartData] = useState<{name: string, count: number, fill: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setIsLoading(true);
      try {
        const cves = await getRecentCves();
        const counts: SeverityCounts = { Critical: 0, High: 0, Medium: 0 };
        
        cves.forEach(cve => {
          const severity = getSeverity(cve.cvssScore);
          if (severity === 'Critical' || severity === 'High' || severity === 'Medium') {
            counts[severity]++;
          }
        });
        
        const formattedChartData = Object.entries(counts).map(([name, count]) => ({
          name,
          count,
          fill: chartConfig[name as keyof typeof chartConfig].color,
        }));

        setChartData(formattedChartData);
      } catch (error) {
        console.error('Failed to load CVE summary data', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSummary();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <Rss className="h-5 w-5" />
                <CardTitle className="text-lg">Threat Intelligence</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/threat-intelligence">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading feed...</span>
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[120px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={-5}
                axisLine={false}
                tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={4} textAnchor="start" fill="hsl(var(--muted-foreground))" fontSize={12}>
                      {payload.value}
                    </text>
                  </g>
                )}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" layout="vertical" radius={4} barSize={20}>
                 {chartData.map((entry) => (
                    <cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2"/>
            <p className="text-sm">Could not load CVE feed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
