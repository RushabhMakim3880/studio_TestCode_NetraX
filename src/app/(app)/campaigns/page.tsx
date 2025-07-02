
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Edit, ClipboardList, Circle, CircleDot, CheckCircle2, User, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { suggestCampaignTasks } from '@/ai/flows/suggest-campaign-tasks-flow';
import { Checkbox } from '@/components/ui/checkbox';
import { CampaignPlanner } from '@/components/campaign-planner';

type Campaign = {
  id: string;
  name: string;
  target: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  startDate: string;
  endDate: string;
};

type TaskType = 'Recon' | 'Phishing' | 'Payload' | 'Post-Exploitation' | 'General';

type Task = {
  id: string;
  campaignId: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  type: TaskType;
  targetProfileId?: string;
  templateId?: string;
};

type Profile = { id: string; fullName: string; };
type Template = { id: string; name: string; };

const initialCampaigns: Campaign[] = [
  { id: 'CAM-001', name: 'Project Chimera', target: 'Global-Corp Inc.', status: 'Active', startDate: '2023-10-01', endDate: '2023-12-31' },
  { id: 'CAM-002', name: 'Operation Viper', target: 'Finance Sector', status: 'Active', startDate: '2023-11-15', endDate: '2024-01-15' },
  { id: 'CAM-003', name: 'Ghost Protocol', target: 'Tech Conglomerate', status: 'Planning', startDate: '2024-01-10', endDate: '2024-03-10' },
  { id: 'CAM-004', name: 'Red Dawn', target: 'Energy Grid', status: 'Completed', startDate: '2023-08-20', endDate: '2023-09-30' },
];

const initialTasks: Task[] = [
  { id: 'TSK-001', campaignId: 'CAM-001', description: 'Initial recon on target subdomains.', status: 'Completed', type: 'Recon' },
  { id: 'TSK-002', campaignId: 'CAM-001', description: 'Craft phishing email template.', status: 'In Progress', type: 'Phishing', targetProfileId: 'PROF-001', templateId: 'TPL-001' },
  { id: 'TSK-003', campaignId: 'CAM-001', description: 'Deploy cloned login page.', status: 'To Do', type: 'Payload' },
  { id: 'TSK-004', campaignId: 'CAM-002', description: 'Analyze OSINT data for key personnel.', status: 'Completed', type: 'Recon' },
  { id: 'TSK-005', campaignId: 'CAM-002', description: 'Prepare initial access payload.', status: 'In Progress', type: 'Payload' },
];

const campaignSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  target: z.string().min(3, 'Target must be at least 3 characters.'),
  startDate: z.string().nonempty('Start date is required.'),
  endDate: z.string().nonempty('End date is required.'),
  generateAiTasks: z.boolean().default(false).optional(),
});

const taskSchema = z.object({
    description: z.string().min(3, 'Description must be at least 3 characters.'),
    type: z.string().min(1, 'Task type is required.'),
    targetProfileId: z.string().optional(),
    templateId: z.string().optional(),
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentCampaignIdForTask, setCurrentCampaignIdForTask] = useState<string | null>(null);

  const [isAiLoading, setIsAiLoading] = useState(false);

  const { toast } = useToast();
  
  const campaignForm = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
  });

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
  });
  const watchedTaskType = taskForm.watch('type');

  useEffect(() => {
    const loadData = () => {
        try {
          const storedCampaigns = localStorage.getItem('netra-campaigns');
          setCampaigns(storedCampaigns ? JSON.parse(storedCampaigns) : initialCampaigns);

          const storedTasks = localStorage.getItem('netra-tasks');
          setTasks(storedTasks ? JSON.parse(storedTasks) : initialTasks);
          
          const storedProfiles = localStorage.getItem('netra-profiles');
          setProfiles(storedProfiles ? JSON.parse(storedProfiles) : []);

          const storedTemplates = localStorage.getItem('netra-templates');
          setTemplates(storedTemplates ? JSON.parse(storedTemplates) : []);
        } catch (error) {
          console.error('Failed to load data from localStorage', error);
        }
    };
    loadData();
  }, []);

  const updateCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('netra-campaigns', JSON.stringify(newCampaigns));
  }
  
  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('netra-tasks', JSON.stringify(newTasks));
  }
  
  // Campaign Handlers
  const handleCreateCampaign = () => {
    setSelectedCampaign(null);
    campaignForm.reset({ name: '', target: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', generateAiTasks: false });
    setIsCampaignFormOpen(true);
  }
  
  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    campaignForm.reset(campaign);
    setIsCampaignFormOpen(true);
  }
  
  const handleDeleteCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteAlertOpen(true);
  }

  const confirmDeleteCampaign = () => {
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

  const onCampaignSubmit = async (values: z.infer<typeof campaignSchema>) => {
    if(selectedCampaign) {
      const updatedCampaigns = campaigns.map(c => c.id === selectedCampaign.id ? { ...c, ...values } : c );
      updateCampaigns(updatedCampaigns);
      toast({ title: 'Campaign Updated', description: `Campaign "${values.name}" has been updated.` });
      setIsCampaignFormOpen(false);
      setSelectedCampaign(null);
      return;
    } 

    const newCampaign: Campaign = { 
        id: `CAM-${crypto.randomUUID()}`, 
        name: values.name,
        target: values.target,
        startDate: values.startDate,
        endDate: values.endDate,
        status: 'Planning' 
    }
    updateCampaigns([...campaigns, newCampaign]);
    toast({ title: 'Campaign Created', description: `New campaign "${values.name}" has been added.` });

    if (values.generateAiTasks) {
        setIsAiLoading(true);
        toast({ title: 'Generating AI Tasks...', description: 'Please wait a moment.' });
        try {
            const result = await suggestCampaignTasks({
                campaignName: newCampaign.name,
                campaignTarget: newCampaign.target,
            });

            const newAiTasks: Task[] = result.tasks.map(task => ({
                id: `TSK-${crypto.randomUUID()}`,
                campaignId: newCampaign.id,
                description: task.description,
                type: task.type as TaskType,
                status: 'To Do',
            }));
            
            updateTasks([...tasks, ...newAiTasks]);
            toast({ title: 'AI Tasks Added', description: `${newAiTasks.length} tasks were generated for your campaign.` });

        } catch (err) {
            console.error('Failed to generate AI tasks:', err);
            toast({
                variant: 'destructive',
                title: 'AI Task Generation Failed',
                description: 'Could not generate tasks for the campaign.',
            });
        } finally {
            setIsAiLoading(false);
        }
    }

    setIsCampaignFormOpen(false);
    setSelectedCampaign(null);
  }

  // Task Handlers
  const handleAddTaskClick = (campaignId: string) => {
    setEditingTask(null);
    setCurrentCampaignIdForTask(campaignId);
    taskForm.reset({ description: '', type: 'General', targetProfileId: '', templateId: '' });
    setIsTaskFormOpen(true);
  }

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setCurrentCampaignIdForTask(task.campaignId);
    taskForm.reset(task);
    setIsTaskFormOpen(true);
  }
  
  const onTaskSubmit = (values: z.infer<typeof taskSchema>) => {
      if (editingTask) {
        const updatedTasks = tasks.map(t => t.id === editingTask.id ? { ...t, ...values } : t);
        updateTasks(updatedTasks);
        toast({ title: "Task Updated" });
      } else if (currentCampaignIdForTask) {
        const newTask: Task = {
            id: `TSK-${crypto.randomUUID()}`,
            campaignId: currentCampaignIdForTask,
            status: 'To Do',
            ...values,
            type: values.type as TaskType,
        };
        updateTasks([...tasks, newTask]);
        toast({ title: "Task Added" });
      }
      setIsTaskFormOpen(false);
      setEditingTask(null);
      setCurrentCampaignIdForTask(null);
  }


  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);
    updateTasks(newTasks);
  }

  const handleDeleteTask = (taskId: string) => {
    updateTasks(tasks.filter(t => t.id !== taskId));
    toast({ title: 'Task removed.' });
  }
  
  const getProfileName = (profileId?: string) => profiles.find(p => p.id === profileId)?.fullName || 'N/A';
  const getTemplateName = (templateId?: string) => templates.find(t => t.id === templateId)?.name || 'N/A';

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Campaign Management</h1>
          <p className="text-muted-foreground">Plan, oversee, and manage all red team campaigns and associated tasks.</p>
        </div>

        <CampaignPlanner />

        <div className="flex items-center justify-between mt-4">
            <h2 className="font-headline text-2xl font-semibold">Active & Planned Campaigns</h2>
            <Button onClick={handleCreateCampaign}>
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
                          <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteCampaign(campaign)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
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
                              <div key={task.id} className="flex items-start justify-between text-sm p-2 rounded-md hover:bg-primary/20">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        {taskStatusIcons[task.status]}
                                        <span className="font-medium">{task.description}</span>
                                        <Badge variant="outline">{task.type}</Badge>
                                    </div>
                                    {task.type === 'Phishing' && (
                                        <div className="pl-6 text-xs text-muted-foreground space-y-1 mt-1">
                                            <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> Target: {getProfileName(task.targetProfileId)}</p>
                                            <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> Template: {getTemplateName(task.templateId)}</p>
                                        </div>
                                    )}
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditTaskClick(task)}>Edit Task</DropdownMenuItem>
                                    <DropdownMenuSeparator />
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
                          <Button size="sm" className="w-full" variant="outline" onClick={() => handleAddTaskClick(campaign.id)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                          </Button>
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

      {/* Campaign Form Dialog */}
      <Dialog open={isCampaignFormOpen} onOpenChange={setIsCampaignFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
            <DialogDescription>{selectedCampaign ? `Update the details for "${selectedCampaign.name}".` : 'Fill in the details for the new campaign.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={campaignForm.handleSubmit(onCampaignSubmit)} className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="name">Campaign Name</Label><Input id="name" {...campaignForm.register('name')} />{campaignForm.formState.errors.name && <p className="text-sm text-destructive">{campaignForm.formState.errors.name.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="target">Target</Label><Input id="target" {...campaignForm.register('target')} />{campaignForm.formState.errors.target && <p className="text-sm text-destructive">{campaignForm.formState.errors.target.message}</p>}</div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" {...campaignForm.register('startDate')} />{campaignForm.formState.errors.startDate && <p className="text-sm text-destructive">{campaignForm.formState.errors.startDate.message}</p>}</div>
                 <div className="space-y-2"><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" {...campaignForm.register('endDate')} />{campaignForm.formState.errors.endDate && <p className="text-sm text-destructive">{campaignForm.formState.errors.endDate.message}</p>}</div>
              </div>
               {!selectedCampaign && (
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="generate-ai-tasks" {...campaignForm.register('generateAiTasks')} />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="generate-ai-tasks"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Use AI to suggest initial tasks
                        </label>
                        <p className="text-sm text-muted-foreground">
                            Automatically create a set of starter tasks for this campaign.
                        </p>
                    </div>
                </div>
                )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCampaignFormOpen(false)} disabled={isAiLoading}>Cancel</Button>
              <Button type="submit" disabled={isAiLoading}>
                {isAiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Campaign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Task Form Dialog */}
      <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                <DialogDescription>{editingTask ? 'Update the details for this task.' : 'Fill in the details for the new task.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea id="task-description" {...taskForm.register('description')} />
                    {taskForm.formState.errors.description && <p className="text-sm text-destructive">{taskForm.formState.errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="task-type">Task Type</Label>
                     <Select onValueChange={(v) => taskForm.setValue('type', v)} defaultValue={taskForm.getValues('type')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Recon">Recon</SelectItem>
                            <SelectItem value="Phishing">Phishing</SelectItem>
                            <SelectItem value="Payload">Payload</SelectItem>
                            <SelectItem value="Post-Exploitation">Post-Exploitation</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {watchedTaskType === 'Phishing' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-profile">Target Profile</Label>
                            <Select onValueChange={(v) => taskForm.setValue('targetProfileId', v)} defaultValue={taskForm.getValues('targetProfileId')}>
                                <SelectTrigger><SelectValue placeholder="Select Profile..." /></SelectTrigger>
                                <SelectContent>
                                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-template">Message Template</Label>
                             <Select onValueChange={(v) => taskForm.setValue('templateId', v)} defaultValue={taskForm.getValues('templateId')}>
                                <SelectTrigger><SelectValue placeholder="Select Template..." /></SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Task</Button>
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
            <AlertDialogAction onClick={confirmDeleteCampaign} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
