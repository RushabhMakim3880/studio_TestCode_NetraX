'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Campaign = {
  id: string;
  name: string;
  target: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  startDate: string;
  endDate: string;
};

const initialCampaigns: Campaign[] = [
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

const campaignSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  target: z.string().min(3, 'Target must be at least 3 characters.'),
  startDate: z.string().nonempty('Start date is required.'),
  endDate: z.string().nonempty('End date is required.'),
});


const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Active: 'default',
  Planning: 'secondary',
  Completed: 'outline',
  'On Hold': 'destructive',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
  });

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem('netra-campaigns');
      if (storedCampaigns) {
        setCampaigns(JSON.parse(storedCampaigns));
      } else {
        setCampaigns(initialCampaigns);
        localStorage.setItem('netra-campaigns', JSON.stringify(initialCampaigns));
      }
    } catch (error) {
      console.error('Failed to load campaigns from localStorage', error);
      setCampaigns(initialCampaigns);
    }
  }, []);

  const updateCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('netra-campaigns', JSON.stringify(newCampaigns));
  }

  const handleCreate = () => {
    setSelectedCampaign(null);
    form.reset({
      name: '',
      target: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
    });
    setIsFormOpen(true);
  }
  
  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    form.reset(campaign);
    setIsFormOpen(true);
  }
  
  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteAlertOpen(true);
  }

  const confirmDelete = () => {
    if (selectedCampaign) {
      const newCampaigns = campaigns.filter(c => c.id !== selectedCampaign.id);
      updateCampaigns(newCampaigns);
      toast({ title: 'Campaign Deleted', description: `Campaign "${selectedCampaign.name}" has been removed.` });
      setIsDeleteAlertOpen(false);
      setSelectedCampaign(null);
    }
  }

  const onSubmit = (values: z.infer<typeof campaignSchema>) => {
    if(selectedCampaign) { // Editing existing campaign
      const updatedCampaigns = campaigns.map(c => 
        c.id === selectedCampaign.id ? { ...c, ...values } : c
      );
      updateCampaigns(updatedCampaigns);
      toast({ title: 'Campaign Updated', description: `Campaign "${values.name}" has been updated.` });
    } else { // Creating new campaign
      const newCampaign: Campaign = {
        id: `CAM-${String(campaigns.length + 1).padStart(3, '0')}`,
        ...values,
        status: 'Planning',
      }
      updateCampaigns([...campaigns, newCampaign]);
      toast({ title: 'Campaign Created', description: `New campaign "${values.name}" has been added.` });
    }
    setIsFormOpen(false);
    setSelectedCampaign(null);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-semibold">Campaign Management</h1>
            <p className="text-muted-foreground">Oversee and manage all active campaigns.</p>
          </div>
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
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
                          <DropdownMenuItem onClick={() => handleEdit(campaign)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(campaign)} className="text-destructive">Delete</DropdownMenuItem>
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
            <DialogDescription>
              {selectedCampaign ? `Update the details for "${selectedCampaign.name}".` : 'Fill in the details for the new campaign.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
              </div>
               <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Input id="target" {...form.register('target')} />
                {form.formState.errors.target && <p className="text-sm text-destructive">{form.formState.errors.target.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...form.register('startDate')} />
                  {form.formState.errors.startDate && <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" {...form.register('endDate')} />
                  {form.formState.errors.endDate && <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>}
                </div>
              </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save Campaign</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign 
              "{selectedCampaign?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
