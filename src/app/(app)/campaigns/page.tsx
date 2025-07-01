
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Edit, ClipboardList, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Campaign = {
  id: string;
  name: string;
  target: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  startDate: string;
  endDate: string;
};

type Task = {
  id: string;
  campaignId: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed';
};

const initialCampaigns: Campaign[] = [
  { id: 'CAM-001', name: 'Project Chimera', target: 'Global-Corp Inc.', status: 'Active', startDate: '2023-10-01', endDate: '2023-12-31' },
  { id: 'CAM-002', name: 'Operation Viper', target: 'Finance Sector', status: 'Active', startDate: '2023-11-15', endDate: '2024-01-15' },
  { id: 'CAM-003', name: 'Ghost Protocol', target: 'Tech Conglomerate', status: 'Planning', startDate: '2024-01-10', endDate: '2024-03-10' },
  { id: 'CAM-004', name: 'Red Dawn', target: 'Energy Grid', status: 'Completed', startDate: '2023-08-20', endDate: '2023-09-30' },
];

const initialTasks: Task[] = [
  { id: 'TSK-001', campaignId: 'CAM-001', description: 'Initial recon on target subdomains.', status: 'Completed' },
  { id: 'TSK-002', campaignId: 'CAM-001', description: 'Craft phishing email template.', status: 'In Progress' },
  { id: 'TSK-003', campaignId: 'CAM-001', description: 'Deploy cloned login page.', status: 'To Do' },
  { id: 'TSK-004', campaignId: 'CAM-002', description: 'Analyze OSINT data for key personnel.', status: 'Completed' },
  { id: 'TSK-005', campaignId: 'CAM-002', description: 'Prepare initial access payload.', status: 'In Progress' },
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

const taskStatusIcons: { [key: string]: React.ReactNode } = {
  'To Do': <Circle className="h-4 w-4 text-muted-foreground" />,
  'In Progress': <CircleDot className="h-4 w-4 text-sky-400" />,
  'Completed': <CheckCircle2 className="h-4 w-4 text-green-400" />,
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
  });

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem('netra-campaigns');
      if (storedCampaigns) { setCampaigns(JSON.parse(storedCampaigns)); } 
      else { setCampaigns(initialCampaigns); localStorage.setItem('netra-campaigns', JSON.stringify(initialCampaigns)); }

      const storedTasks = localStorage.getItem('netra-tasks');
      if (storedTasks) { setTasks(JSON.parse(storedTasks)); }
      else { setTasks(initialTasks); localStorage.setItem('netra-tasks', JSON.stringify(initialTasks)); }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
      setCampaigns(initialCampaigns);
      setTasks(initialTasks);
    }
  }, []);

  const updateCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('netra-campaigns', JSON.stringify(newCampaigns));
  }
  
  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('netra-tasks', JSON.stringify(newTasks));
  }

  const handleCreate = () => {
    setSelectedCampaign(null);
    form.reset({ name: '', target: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '' });
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
      const newTasks = tasks.filter(t => t.campaignId !== selectedCampaign.id);
      updateCampaigns(newCampaigns);
      updateTasks(newTasks);
      toast({ title: 'Campaign Deleted', description: `Campaign "${selectedCampaign.name}" and its tasks have been removed.` });
      setIsDeleteAlertOpen(false);
      setSelectedCampaign(null);
    }
  }

  const onSubmit = (values: z.infer<typeof campaignSchema>) => {
    if(selectedCampaign) {
      const updatedCampaigns = campaigns.map(c => c.id === selectedCampaign.id ? { ...c, ...values } : c );
      updateCampaigns(updatedCampaigns);
      toast({ title: 'Campaign Updated', description: `Campaign "${values.name}" has been updated.` });
    } else {
      const newCampaign: Campaign = { id: `CAM-${String(campaigns.length + 1).padStart(3, '0')}`, ...values, status: 'Planning' }
      updateCampaigns([...campaigns, newCampaign]);
      toast({ title: 'Campaign Created', description: `New campaign "${values.name}" has been added.` });
    }
    setIsFormOpen(false);
    setSelectedCampaign(null);
  }

  const handleAddTask = (campaignId: string) => {
    const description = newTaskInputs[campaignId]?.trim();
    if (!description) {
      toast({ variant: 'destructive', title: 'Task description cannot be empty.' });
      return;
    }
    const newTask: Task = {
      id: `TSK-${crypto.randomUUID()}`,
      campaignId,
      description,
      status: 'To Do',
    };
    updateTasks([...tasks, newTask]);
    setNewTaskInputs(prev => ({ ...prev, [campaignId]: '' }));
  }

  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);
    updateTasks(newTasks);
  }

  const handleDeleteTask = (taskId: string) => {
    updateTasks(tasks.filter(t => t.id !== taskId));
    toast({ title: 'Task removed.' });
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-semibold">Campaign Management</h1>
            <p className="text-muted-foreground">Oversee and manage all active campaigns and associated tasks.</p>
          </div>
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const campaignTasks = tasks.filter(t => t.campaignId === campaign.id);
              return (
                <Card key={campaign.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{campaign.name}</CardTitle>
                        <CardDescription>Target: {campaign.target}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(campaign)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(campaign)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <Badge variant={statusVariant[campaign.status] || 'default'}>{campaign.status}</Badge>
                    <p className="text-sm text-muted-foreground">Duration: {campaign.startDate} to {campaign.endDate}</p>
                  </CardContent>
                  <CardFooter>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="tasks" className="border-b-0">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            <span>Tasks ({campaignTasks.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {campaignTasks.length > 0 ? campaignTasks.map(task => (
                              <div key={task.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-primary/20">
                                <span className="flex items-center gap-2">
                                  {taskStatusIcons[task.status]}
                                  {task.description}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'To Do')}>To Do</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}>In Progress</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'Completed')}>Completed</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>Delete Task</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )) : <p className="text-sm text-muted-foreground text-center py-4">No tasks for this campaign yet.</p>}
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="New task description..." 
                              value={newTaskInputs[campaign.id] || ''}
                              onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [campaign.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTask(campaign.id)}
                            />
                            <Button size="sm" onClick={() => handleAddTask(campaign.id)}>Add</Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center py-20">
            <CardHeader><CardTitle>No Campaigns Yet</CardTitle><CardDescription>Click "New Campaign" to get started.</CardDescription></CardHeader>
          </Card>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
            <DialogDescription>{selectedCampaign ? `Update the details for "${selectedCampaign.name}".` : 'Fill in the details for the new campaign.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="name">Campaign Name</Label><Input id="name" {...form.register('name')} />{form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="target">Target</Label><Input id="target" {...form.register('target')} />{form.formState.errors.target && <p className="text-sm text-destructive">{form.formState.errors.target.message}</p>}</div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" {...form.register('startDate')} />{form.formState.errors.startDate && <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>}</div>
                 <div className="space-y-2"><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" {...form.register('endDate')} />{form.formState.errors.endDate && <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>}</div>
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
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the campaign "{selectedCampaign?.name}" and all of its associated tasks.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
