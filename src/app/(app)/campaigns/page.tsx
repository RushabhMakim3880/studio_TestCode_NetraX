'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const campaigns = [
  {
    id: 'CAM-001',
    name: 'Project Chimera',
    target: 'Global-Corp Inc.',
    status: 'Active',
    startDate: '2023-10-01',
    endDate: '2023-12-31',
  },
  {
    id: 'CAM-002',
    name: 'Operation Viper',
    target: 'Finance Sector',
    status: 'Active',
    startDate: '2023-11-15',
    endDate: '2024-01-15',
  },
  {
    id: 'CAM-003',
    name: 'Ghost Protocol',
    target: 'Tech Conglomerate',
    status: 'Planning',
    startDate: '2024-01-10',
    endDate: '2024-03-10',
  },
  {
    id: 'CAM-004',
    name: 'Red Dawn',
    target: 'Energy Grid',
    status: 'Completed',
    startDate: '2023-08-20',
    endDate: '2023-09-30',
  },
  {
    id: 'CAM-005',
    name: 'Cyber Sentinel',
    target: 'Healthcare Org',
    status: 'On Hold',
    startDate: '2023-09-05',
    endDate: '2023-11-05',
  },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Active: 'default',
  Planning: 'secondary',
  Completed: 'outline',
  'On Hold': 'destructive',
};

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Campaign Management</h1>
        <p className="text-muted-foreground">Oversee and manage all active campaigns.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active & Upcoming Campaigns</CardTitle>
          <CardDescription>A list of ongoing, planned, and past operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.id}</TableCell>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>{campaign.target}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[campaign.status] || 'default'}>{campaign.status}</Badge>
                  </TableCell>
                  <TableCell>{campaign.startDate}</TableCell>
                  <TableCell>{campaign.endDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
