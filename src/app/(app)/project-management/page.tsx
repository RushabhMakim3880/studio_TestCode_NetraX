
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Edit, ClipboardList, Circle, CircleDot, CheckCircle2, User, Mail, Loader2, Flag, Link as LinkIcon } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, type User as AuthUser } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';
type Project = {
  id: string;
  name: string;
  target: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
};

type TaskType = 'Recon' | 'Phishing' | 'Payload' | 'Post-Exploitation' | 'General';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type TaskStatus = 'To Do' | 'In Progress' | 'Completed';

type Task = {
  id: string;
  projectId: string;
  description: string;
  status: TaskStatus;
  type: TaskType;
  priority: TaskPriority;
  assignedTo?: string; // username
  targetProfileId?: string;
  templateId?: string;
  mitreTtp?: string;
};

type Profile = { 
  id: string; 
  fullName: string;
  email: string;
  role: string;
  company: string;
  notes?: string;
};
type Template = { id: string; name: string; };

const initialProjects: Project[] = [
  { id: 'PROJ-001', name: 'Project Chimera', target: 'Global-Corp Inc.', status: 'Active', startDate: '2023-10-01', endDate: '2023-12-31' },
  { id: 'PROJ-002', name: 'Operation Viper', target: 'Finance Sector', status: 'Active', startDate: '2023-11-15', endDate: '2024-01-15' },
  { id: 'PROJ-003', name: 'Ghost Protocol', target: 'Tech Conglomerate', status: 'Planning', startDate: '2024-01-10', endDate: '2024-03-10' },
  { id: 'PROJ-004', name: 'Red Dawn', target: 'Energy Grid', status: 'Completed', startDate: '2023-08-20', endDate: '2023-09-30' },
];

const initialTasks: Task[] = [
  { id: 'TSK-001', projectId: 'PROJ-001', description: 'Initial recon on target subdomains.', status: 'Completed', type: 'Recon', priority: 'High', assignedTo: 'analyst', mitreTtp: 'T1595' },
  { id: 'TSK-002', projectId: 'PROJ-001', description: 'Craft phishing email template.', status: 'In Progress', type: 'Phishing', targetProfileId: 'PROF-001', templateId: 'TPL-001', priority: 'Medium', assignedTo: 'operator', mitreTtp: 'T1566.001' },
  { id: 'TSK-003', projectId: 'PROJ-001', description: 'Deploy cloned login page.', status: 'To Do', type: 'Payload', priority: 'High' },
  { id: 'TSK-004', projectId: 'PROJ-002', description: 'Analyze OSINT data for key personnel.', status: 'Completed', type: 'Recon', priority: 'Medium', assignedTo: 'analyst' },
  { id: 'TSK-005', projectId: 'PROJ-002', description: 'Prepare initial access payload.', status: 'In Progress', type: 'Payload', priority: 'Critical', assignedTo: 'operator' },
];

const projectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  target: z.string().min(3, 'Target must be at least 3 characters.'),
  startDate: z.string().nonempty('Start date is required.'),
  endDate: z.string().nonempty('End date is required.'),
  generateAiTasks: z.boolean().default(false).optional(),
});

const taskSchema = z.object({
    description: z.string().min(3, 'Description must be at least 3 characters.'),
    type: z.string().min(1, 'Task type is required.'),
    priority: z.string().min(1, 'Priority is required.'),
    assignedTo: z.string().optional(),
    targetProfileId: z.string().optional(),
    templateId: z.string().optional(),
    mitreTtp: z.string().optional(),
});

const profileSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  role: z.string().min(2, 'Role is required.'),
  company: z.string().min(2, 'Company is required.'),
  notes: z.string().optional(),
});


const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Active: 'default',
  Planning: 'secondary',
  Completed: 'outline',
  'On Hold': 'destructive',
};

const taskStatusIcons: { [key in TaskStatus]: React.ReactNode } = {
  'To Do': <Circle className="h-4 w-4 text-muted-foreground" />,
  'In Progress': <CircleDot className="h-4 w-4 text-sky-400" />,
  'Completed': <CheckCircle2 className="h-4 w-4 text-green-400" />,
}

const priorityColors: { [key in TaskPriority]: string } = {
    'Low': 'text-sky-400',
    'Medium': 'text-amber-400',
    'High': 'text-orange-500',
    'Critical': 'text-destructive',
};

export default function ProjectManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<ProjectStatus | 'All'>('All');

  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentProjectIdForTask, setCurrentProjectIdForTask] = useState<string | null>(null);

  const [isAiLoading, setIsAiLoading] = useState(false);

  const { toast } = useToast();
  const { user: currentUser, users: teamMembers } = useAuth();
  
  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
  });

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });
  
  const watchedTaskType = taskForm.watch('type');

  useEffect(() => {
    const loadData = () => {
        try {
          const storedProjects = localStorage.getItem('netra-projects');
          setProjects(storedProjects ? JSON.parse(storedProjects) : initialProjects);

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

  const updateProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    localStorage.setItem('netra-projects', JSON.stringify(newProjects));
  }
  
  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('netra-tasks', JSON.stringify(newTasks));
  }

  const updateProfiles = (newProfiles: Profile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem('netra-profiles', JSON.stringify(newProfiles));
  }

  const filteredProjects = useMemo(() => {
    if (filter === 'All') return projects;
    return projects.filter(p => p.status === filter);
  }, [projects, filter]);
  
  // Project Handlers
  const handleCreateProject = () => {
    setSelectedProject(null);
    projectForm.reset({ name: '', target: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', generateAiTasks: false });
    setIsProjectFormOpen(true);
  }
  
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    projectForm.reset(project);
    setIsProjectFormOpen(true);
  }
  
  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteAlertOpen(true);
  }

  const confirmDeleteProject = () => {
    if (selectedProject) {
      const newProjects = projects.filter(c => c.id !== selectedProject.id);
      const newTasks = tasks.filter(t => t.projectId !== selectedProject.id);
      updateProjects(newProjects);
      updateTasks(newTasks);
      toast({ title: 'Project Deleted', description: `Project "${selectedProject.name}" and its tasks have been removed.` });
      setIsDeleteAlertOpen(false);
      setSelectedProject(null);
    }
  }

  const onProjectSubmit = async (values: z.infer<typeof projectSchema>) => {
    if(selectedProject) {
      const updatedProjects = projects.map(c => c.id === selectedProject.id ? { ...c, ...values, status: c.status } : c );
      updateProjects(updatedProjects);
      toast({ title: 'Project Updated', description: `Project "${values.name}" has been updated.` });
      setIsProjectFormOpen(false);
      setSelectedProject(null);
      return;
    } 

    const newProject: Project = { 
        id: `PROJ-${crypto.randomUUID()}`, 
        name: values.name,
        target: values.target,
        startDate: values.startDate,
        endDate: values.endDate,
        status: 'Planning' 
    }
    updateProjects([...projects, newProject]);
    toast({ title: 'Project Created', description: `New project "${values.name}" has been added.` });
    logActivity({
        user: currentUser?.displayName || 'Admin',
        action: 'Created Project',
        details: `Project Name: ${newProject.name}`
    });


    if (values.generateAiTasks) {
        setIsAiLoading(true);
        toast({ title: 'Generating AI Tasks...', description: 'Please wait a moment.' });
        try {
            const result = await suggestCampaignTasks({
                campaignName: newProject.name,
                campaignTarget: newProject.target,
            });

            const newAiTasks: Task[] = result.tasks.map(task => ({
                id: `TSK-${crypto.randomUUID()}`,
                projectId: newProject.id,
                description: task.description,
                type: task.type as TaskType,
                status: 'To Do',
                priority: 'Medium',
            }));
            
            updateTasks([...tasks, ...newAiTasks]);
            toast({ title: 'AI Tasks Added', description: `${newAiTasks.length} tasks were generated for your project.` });

        } catch (err) {
            console.error('Failed to generate AI tasks:', err);
            toast({
                variant: 'destructive',
                title: 'AI Task Generation Failed',
                description: 'Could not generate tasks for the project.',
            });
        } finally {
            setIsAiLoading(false);
        }
    }

    setIsProjectFormOpen(false);
    setSelectedProject(null);
  }

  // Task Handlers
  const handleAddTaskClick = (projectId: string) => {
    setEditingTask(null);
    setCurrentProjectIdForTask(projectId);
    taskForm.reset({ description: '', type: 'General', priority: 'Medium', targetProfileId: '', templateId: '', mitreTtp: '' });
    setIsTaskFormOpen(true);
  }

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setCurrentProjectIdForTask(task.projectId);
    taskForm.reset(task);
    setIsTaskFormOpen(true);
  }
  
  const onTaskSubmit = (values: z.infer<typeof taskSchema>) => {
      if (editingTask) {
        const updatedTasks = tasks.map(t => t.id === editingTask.id ? { ...t, ...values, type: values.type as TaskType, priority: values.priority as TaskPriority } : t);
        updateTasks(updatedTasks);
        toast({ title: "Task Updated" });
      } else if (currentProjectIdForTask) {
        const newTask: Task = {
            id: `TSK-${crypto.randomUUID()}`,
            projectId: currentProjectIdForTask,
            status: 'To Do',
            ...values,
            type: values.type as TaskType,
            priority: values.priority as TaskPriority,
        };
        updateTasks([...tasks, newTask]);
        toast({ title: "Task Added" });
      }
      setIsTaskFormOpen(false);
      setEditingTask(null);
      setCurrentProjectIdForTask(null);
  }


  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);
    updateTasks(newTasks);
  }

  const handleDeleteTask = (taskId: string) => {
    updateTasks(tasks.filter(t => t.id !== taskId));
    toast({ title: 'Task removed.' });
  }

  const handleCreateNewProfile = (values: z.infer<typeof profileSchema>) => {
    const newProfile: Profile = {
        id: `PROF-${crypto.randomUUID()}`,
        ...values,
    };
    updateProfiles([...profiles, newProfile]);
    toast({ title: 'Profile Created', description: `New profile for "${values.fullName}" has been added.` });
    
    // Auto-select the newly created profile in the task form
    taskForm.setValue('targetProfileId', newProfile.id);

    setIsProfileFormOpen(false);
  }
  
  const getProfileName = (profileId?: string) => profiles.find(p => p.id === profileId)?.fullName || 'N/A';
  const getTemplateName = (templateId?: string) => templates.find(t => t.id === templateId)?.name || 'N/A';
  
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAssignee = (username?: string) => teamMembers.find(m => m.username === username);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Project Management</h1>
          <p className="text-muted-foreground">Plan, oversee, and manage all red team projects and associated tasks.</p>
        </div>

        <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="planner">AI Project Planner</TabsTrigger>
                <TabsTrigger value="projects">Projects & Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="planner" className="mt-4">
                <CampaignPlanner />
            </TabsContent>
            <TabsContent value="projects" className="mt-4">
                 <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Button variant={filter === 'All' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('All')}>All</Button>
                            <Button variant={filter === 'Active' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('Active')}>Active</Button>
                            <Button variant={filter === 'Planning' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('Planning')}>Planning</Button>
                            <Button variant={filter === 'Completed' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('Completed')}>Completed</Button>
                        </div>
                    </div>
                    <Button onClick={handleCreateProject}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </div>

                {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                    {filteredProjects.map((project) => {
                    const projectTasks = tasks.filter(t => t.projectId === project.id);
                    return (
                        <Card key={project.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                            <div>
                                <CardTitle>{project.name}</CardTitle>
                                <CardDescription>Target: {project.target}</CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditProject(project)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteProject(project)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                            <Badge variant={statusVariant[project.status] || 'default'}>{project.status}</Badge>
                            <p className="text-sm text-muted-foreground">Duration: {project.startDate} to {project.endDate}</p>
                        </CardContent>
                        <CardFooter>
                            <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="tasks" className="border-b-0">
                                <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4" />
                                    <span>Tasks ({projectTasks.length})</span>
                                </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {projectTasks.length > 0 ? projectTasks.map(task => {
                                      const assignee = getAssignee(task.assignedTo);
                                      return (
                                        <div key={task.id} className="flex items-start justify-between text-sm p-2 rounded-md hover:bg-primary/20">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2">
                                                    {taskStatusIcons[task.status]}
                                                    <span className="font-medium">{task.description}</span>
                                                    <Badge variant="outline">{task.type}</Badge>
                                                </div>
                                                <div className="pl-6 text-xs text-muted-foreground space-y-1 mt-1">
                                                    <div className="flex items-center gap-4">
                                                        <TooltipProvider><Tooltip><TooltipTrigger>
                                                          <Flag className={`h-3 w-3 ${priorityColors[task.priority]}`} />
                                                        </TooltipTrigger><TooltipContent><p>{task.priority} Priority</p></TooltipContent></Tooltip></TooltipProvider>
                                                        {assignee && (
                                                            <TooltipProvider><Tooltip><TooltipTrigger>
                                                               <Avatar className="h-4 w-4"><AvatarImage src={assignee.avatarUrl || ''} /><AvatarFallback className="text-[8px]">{getInitials(assignee.displayName)}</AvatarFallback></Avatar>
                                                            </TooltipTrigger><TooltipContent><p>Assigned to {assignee.displayName}</p></TooltipContent></Tooltip></TooltipProvider>
                                                        )}
                                                        {task.mitreTtp && (
                                                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                                               <Link href={`https://attack.mitre.org/techniques/${task.mitreTtp.replace('.', '/')}`} target="_blank">
                                                                    <Badge variant="destructive" className="font-mono text-xs">{task.mitreTtp}</Badge>
                                                               </Link>
                                                            </TooltipTrigger><TooltipContent><p>View MITRE ATT&amp;CK Technique</p></TooltipContent></Tooltip></TooltipProvider>
                                                        )}
                                                    </div>
                                                    {task.type === 'Phishing' && (
                                                      <>
                                                        <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> Target: {getProfileName(task.targetProfileId)}</p>
                                                        <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> Template: {getTemplateName(task.templateId)}</p>
                                                      </>
                                                    )}
                                                </div>
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
                                      )
                                    }) : <p className="text-sm text-muted-foreground text-center py-4">No tasks for this project yet.</p>}
                                </div>
                                <Button size="sm" className="w-full" variant="outline" onClick={() => handleAddTaskClick(project.id)}>
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
                <Card className="flex flex-col items-center justify-center py-20 mt-4">
                    <CardHeader><CardTitle>No projects found with status "{filter}"</CardTitle><CardDescription>Try selecting a different filter.</CardDescription></CardHeader>
                </Card>
                )}
            </TabsContent>
        </Tabs>
      </div>

      {/* Project Form Dialog */}
      <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            <DialogDescription>{selectedProject ? `Update the details for "${selectedProject.name}".` : 'Fill in the details for the new project.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="name">Project Name</Label><Input id="name" {...projectForm.register('name')} />{projectForm.formState.errors.name && <p className="text-sm text-destructive">{projectForm.formState.errors.name.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="target">Target</Label><Input id="target" {...projectForm.register('target')} />{projectForm.formState.errors.target && <p className="text-sm text-destructive">{projectForm.formState.errors.target.message}</p>}</div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" {...projectForm.register('startDate')} />{projectForm.formState.errors.startDate && <p className="text-sm text-destructive">{projectForm.formState.errors.startDate.message}</p>}</div>
                 <div className="space-y-2"><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" {...projectForm.register('endDate')} />{projectForm.formState.errors.endDate && <p className="text-sm text-destructive">{projectForm.formState.errors.endDate.message}</p>}</div>
              </div>
               {!selectedProject && (
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="generate-ai-tasks" {...projectForm.register('generateAiTasks')} />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="generate-ai-tasks"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Use AI to suggest initial tasks
                        </label>
                        <p className="text-sm text-muted-foreground">
                            Automatically create a set of starter tasks for this project.
                        </p>
                    </div>
                </div>
                )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProjectFormOpen(false)} disabled={isAiLoading}>Cancel</Button>
              <Button type="submit" disabled={isAiLoading}>
                {isAiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Project
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
                 <div className="grid grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                        <Label htmlFor="task-priority">Priority</Label>
                        <Select onValueChange={(v) => taskForm.setValue('priority', v)} defaultValue={taskForm.getValues('priority')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="task-assignee">Assign To</Label>
                        <Select onValueChange={(v) => taskForm.setValue('assignedTo', v === 'unassigned' ? '' : v)} defaultValue={taskForm.getValues('assignedTo')}>
                            <SelectTrigger><SelectValue placeholder="Unassigned"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {teamMembers.map(m => <SelectItem key={m.username} value={m.username}>{m.displayName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="task-mitre">MITRE ATT&amp;CK TTP</Label>
                        <Input id="task-mitre" placeholder="e.g., T1566.001" {...taskForm.register('mitreTtp')} className="font-mono" />
                    </div>
                 </div>
                {watchedTaskType === 'Phishing' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-profile">Target Profile</Label>
                            <Select
                                onValueChange={(v) => {
                                    if (v === '__add_new__') {
                                        profileForm.reset();
                                        setIsProfileFormOpen(true);
                                    } else {
                                        taskForm.setValue('targetProfileId', v);
                                    }
                                }}
                                value={taskForm.getValues('targetProfileId')}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Profile..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__add_new__" className="text-accent">＋ Add New Profile...</SelectItem>
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
      
      {/* Nested Profile Creation Dialog */}
      <Dialog open={isProfileFormOpen} onOpenChange={setIsProfileFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Target Profile</DialogTitle>
                <DialogDescription>Add a new target profile. It will be automatically selected for this task.</DialogDescription>
            </DialogHeader>
            <form onSubmit={profileForm.handleSubmit(handleCreateNewProfile)} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="new-profile-fullName">Full Name</Label>
                    <Input id="new-profile-fullName" {...profileForm.register('fullName')} />
                    {profileForm.formState.errors.fullName && <p className="text-sm text-destructive">{profileForm.formState.errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-profile-email">Email</Label>
                    <Input id="new-profile-email" type="email" {...profileForm.register('email')} />
                    {profileForm.formState.errors.email && <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-profile-role">Role / Position</Label>
                        <Input id="new-profile-role" {...profileForm.register('role')} />
                        {profileForm.formState.errors.role && <p className="text-sm text-destructive">{profileForm.formState.errors.role.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-profile-company">Company</Label>
                        <Input id="new-profile-company" {...profileForm.register('company')} />
                        {profileForm.formState.errors.company && <p className="text-sm text-destructive">{profileForm.formState.errors.company.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-profile-notes">Notes</Label>
                    <Textarea id="new-profile-notes" {...profileForm.register('notes')} placeholder="Add any relevant notes for this target..."/>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsProfileFormOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Profile</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the project "{selectedProject?.name}" and all of its associated tasks.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    