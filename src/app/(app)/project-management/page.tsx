

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Edit, ClipboardList, Circle, CircleDot, CheckCircle2, User, Mail, Loader2, Flag, Link as LinkIcon, Paperclip, Lock, MessageSquare, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { suggestCampaignTasks } from '@/ai/flows/suggest-campaign-tasks-flow';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, type User as AuthUser } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { FileSystemNode } from '@/components/file-browser';
import { ProjectGanttChart } from '@/components/project-gantt-chart';
import { CampaignPlanner } from '@/components/campaign-planner';
import { useLocalStorage } from '@/hooks/use-local-storage';

type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';
export type Project = {
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

export type Task = {
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
  evidenceIds?: string[];
  dependsOn?: string[];
  parentTaskId?: string;
};

type Comment = {
    id: string;
    taskId: string;
    authorName: string;
    authorAvatarUrl?: string | null;
    content: string;
    timestamp: string;
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
  { id: 'TSK-001', projectId: 'PROJ-001', description: 'Initial recon on target subdomains.', status: 'Completed', type: 'Recon', priority: 'High', assignedTo: 'analyst', mitreTtp: 'T1595', evidenceIds: ['3-2'] },
  { id: 'TSK-002', projectId: 'PROJ-001', description: 'Craft phishing email template.', status: 'In Progress', type: 'Phishing', targetProfileId: 'PROF-001', templateId: 'TPL-001', priority: 'Medium', assignedTo: 'operator', mitreTtp: 'T1566.001', dependsOn: ['TSK-001'] },
  { id: 'TSK-003', projectId: 'PROJ-001', description: 'Deploy cloned login page.', status: 'To Do', type: 'Payload', priority: 'High', dependsOn: ['TSK-002'] },
  { id: 'TSK-004', projectId: 'PROJ-002', description: 'Analyze OSINT data for key personnel.', status: 'Completed', type: 'Recon', priority: 'Medium', assignedTo: 'analyst', evidenceIds: ['3-3'] },
  { id: 'TSK-005', projectId: 'PROJ-002', description: 'Prepare initial access payload.', status: 'In Progress', type: 'Payload', priority: 'Critical', assignedTo: 'operator', dependsOn: ['TSK-004']},
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
    evidenceIds: z.array(z.string()).optional(),
    dependsOn: z.array(z.string()).optional(),
    parentTaskId: z.string().optional(),
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

function TaskComments({ taskId }: { taskId: string }) {
    const { user: currentUser } = useAuth();
    const { value: comments, setValue: setComments } = useLocalStorage<Comment[]>('netra-comments', []);
    const [newComment, setNewComment] = useState('');

    const taskComments = useMemo(() => {
        return comments.filter(c => c.taskId === taskId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [comments, taskId]);

    const handlePostComment = () => {
        if (!newComment.trim() || !currentUser) return;
        const comment: Comment = {
            id: crypto.randomUUID(),
            taskId,
            authorName: currentUser.displayName,
            authorAvatarUrl: currentUser.avatarUrl,
            content: newComment.trim(),
            timestamp: new Date().toISOString(),
        };
        setComments([...comments, comment]);
        setNewComment('');
    };

    const getInitials = (name?: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className="pt-2">
            <h4 className="text-sm font-semibold mb-2">Comments</h4>
            <div className="space-y-3">
                {taskComments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.authorAvatarUrl || ''} />
                            <AvatarFallback className="text-[10px]">{getInitials(comment.authorName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-background/50 rounded-md p-2">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold">{comment.authorName}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                        </div>
                    </div>
                ))}
                 <div className="flex gap-2">
                    <Textarea 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment... (@mention coming soon)"
                        className="text-sm h-16"
                    />
                    <Button onClick={handlePostComment} size="sm">Post</Button>
                 </div>
            </div>
        </div>
    );
}

const TaskCard = ({ task, allTasks, level = 0 }: { task: Task, allTasks: Task[], level?: number }) => {
    const { users: teamMembers } = useAuth();
    const { toast } = useToast();
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [currentProjectIdForTask, setCurrentProjectIdForTask] = useState<string | null>(null);

    const getAssignee = (username?: string) => teamMembers.find(m => m.username === username);
    const getInitials = (name?: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };
    const getIsBlocked = (task: Task): boolean => {
        if (!task.dependsOn || task.dependsOn.length === 0) return false;
        return task.dependsOn.some(depId => {
            const dependentTask = allTasks.find(t => t.id === depId);
            return dependentTask && dependentTask.status !== 'Completed';
        });
    }

    const handleAddTaskClick = (projectId: string, parentTaskId?: string) => {
        setEditingTask(null);
        setCurrentProjectIdForTask(projectId);
        // I'll leave the form handling in the main component to avoid prop drilling setValue
    }

    const isBlocked = getIsBlocked(task);
    const assignee = getAssignee(task.assignedTo);
    const subTasks = allTasks.filter(t => t.parentTaskId === task.id);
    
    return (
        <div style={{ marginLeft: `${level * 1}rem`}} className="space-y-2">
            <Card className="p-3 bg-background/50">
                <div className="flex items-start justify-between text-sm">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2">
                            {isBlocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : taskStatusIcons[task.status]}
                            <span className={`font-medium ${isBlocked ? 'text-muted-foreground line-through' : ''}`}>{task.description}</span>
                            <Badge variant="outline">{task.type}</Badge>
                        </div>
                        <div className="pl-6 text-xs text-muted-foreground space-y-1 mt-1">
                          <div className="flex items-center gap-4">
                              <TooltipProvider><Tooltip><TooltipTrigger>
                                  <Flag className={`h-3 w-3 ${priorityColors[task.priority]}`} />
                              </TooltipTrigger><TooltipContent><p>{task.priority} Priority</p></TooltipContent></Tooltip></TooltipProvider>
                              {assignee && (
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                  <Avatar className="h-4 w-4"><AvatarImage src={assignee.avatarUrl || ''} /><AvatarFallback className="text-[8px]">{getInitials(assignee.displayName)}</AvatarFallback></Avatar>
                                  </TooltipTrigger><TooltipContent><p>Assigned to {assignee.displayName}</p></TooltipContent></Tooltip></TooltipProvider>
                              )}
                          </div>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                             <DropdownMenuItem onClick={() => { /* Placeholder for main component's edit handler */ }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { /* Placeholder for main component's add sub-task handler */ }}>
                                <CornerDownRight className="mr-2 h-4 w-4" /> Add Sub-task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => { /* Placeholder for main component's delete handler */ }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                </div>
                <Separator className="my-2"/>
                <TaskComments taskId={task.id} />
            </Card>
            <div className="pl-4 border-l ml-2 space-y-2">
                {subTasks.map(subTask => <TaskCard key={subTask.id} task={subTask} allTasks={allTasks} level={level + 1} />)}
            </div>
        </div>
    );
};


export default function ProjectManagementPage() {
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>('netra-projects', initialProjects);
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>('netra-tasks', initialTasks);
  const { value: profiles, setValue: setProfiles } = useLocalStorage<Profile[]>('netra-profiles', []);
  const { value: templates, setValue: setTemplates } = useLocalStorage<Template[]>('netra-templates', []);
  const { value: allFiles, setValue: setAllFiles } = useLocalStorage<FileSystemNode[]>('netra-fs', []);
  
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
      setProjects(newProjects);
      setTasks(newTasks);
      toast({ title: 'Project Deleted', description: `Project "${selectedProject.name}" and its tasks have been removed.` });
      setIsDeleteAlertOpen(false);
      setSelectedProject(null);
    }
  }

  const onProjectSubmit = async (values: z.infer<typeof projectSchema>) => {
    if(selectedProject) {
      const updatedProjects = projects.map(c => c.id === selectedProject.id ? { ...c, ...values, status: c.status } : c );
      setProjects(updatedProjects);
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
    setProjects([...projects, newProject]);
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
            
            setTasks([...tasks, ...newAiTasks]);
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
  const handleAddTaskClick = (projectId: string, parentTaskId?: string) => {
    setEditingTask(null);
    setCurrentProjectIdForTask(projectId);
    taskForm.reset({ description: '', type: 'General', priority: 'Medium', targetProfileId: '', templateId: '', mitreTtp: '', evidenceIds: [], dependsOn: [], parentTaskId: parentTaskId || '' });
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
        setTasks(updatedTasks);
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
        setTasks([...tasks, newTask]);
        toast({ title: "Task Added" });
      }
      setIsTaskFormOpen(false);
      setEditingTask(null);
      setCurrentProjectIdForTask(null);
  }

  const handleUpdateTaskStatus = (taskId: string, status: Task['status'], isBlocked: boolean) => {
    if (isBlocked && status !== 'To Do') {
        toast({ variant: 'destructive', title: 'Task Blocked', description: 'Complete all dependencies before starting this task.'});
        return;
    }
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);
    setTasks(newTasks);
  }

  const handleDeleteTask = (taskId: string) => {
    const newTasks = tasks.filter(t => t.id !== taskId).map(t => ({
        ...t,
        dependsOn: t.dependsOn?.filter(depId => depId !== taskId)
    }));
    setTasks(newTasks);
    toast({ title: 'Task removed.' });
  }

  const handleCreateNewProfile = (values: z.infer<typeof profileSchema>) => {
    const newProfile: Profile = {
        id: `PROF-${crypto.randomUUID()}`,
        ...values,
    };
    setProfiles([...profiles, newProfile]);
    toast({ title: 'Profile Created', description: `New profile for "${values.fullName}" has been added.` });
    
    taskForm.setValue('targetProfileId', newProfile.id);

    setIsProfileFormOpen(false);
  }
  
  const getProfileName = (profileId?: string) => profiles.find(p => p.id === profileId)?.fullName || 'N/A';
  const getTemplateName = (templateId?: string) => templates.find(t => t.id === templateId)?.name || 'N/A';
  const getFileName = (fileId?: string) => allFiles.find(f => f.id === fileId)?.name || 'N/A';
  
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAssignee = (username?: string) => teamMembers.find(m => m.username === username);

  const getTaskIsBlocked = (task: Task): boolean => {
      if (!task.dependsOn || task.dependsOn.length === 0) return false;
      return task.dependsOn.some(depId => {
          const dependentTask = tasks.find(t => t.id === depId);
          return dependentTask && dependentTask.status !== 'Completed';
      });
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-headline text-3xl font-semibold">Project Management</h1>
          <p className="text-muted-foreground">Plan, oversee, and manage all red team projects and associated tasks.</p>
        </div>

        <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="planner">AI Project Planner</TabsTrigger>
                <TabsTrigger value="projects">Projects & Tasks</TabsTrigger>
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
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
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => {
                      const projectTasks = tasks.filter(t => t.projectId === project.id && !t.parentTaskId); // Only top-level tasks
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
                                      <span>Tasks ({tasks.filter(t => t.projectId === project.id).length})</span>
                                  </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="space-y-4">
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                      {projectTasks.length > 0 ? projectTasks.map(task => <TaskCard key={task.id} task={task} allTasks={tasks}/>) : <p className="text-sm text-muted-foreground text-center py-4">No tasks for this project yet.</p>}
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
                    })
                  ) : (
                    <Card className="flex flex-col items-center justify-center py-20 mt-4 xl:col-span-3">
                        <CardHeader><CardTitle>No projects found with status "{filter}"</CardTitle><CardDescription>Try selecting a different filter.</CardDescription></CardHeader>
                    </Card>
                  )}
                </div>
            </TabsContent>
            <TabsContent value="timeline" className="mt-4">
                <ProjectGanttChart projects={projects} />
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
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4 py-4">
                <FormField control={projectForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input placeholder="e.g., Project Viper" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={projectForm.control} name="target" render={({ field }) => ( <FormItem><FormLabel>Target</FormLabel><FormControl><Input placeholder="e.g., Acme Corp" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={projectForm.control} name="startDate" render={({ field }) => ( <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={projectForm.control} name="endDate" render={({ field }) => ( <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                </div>
                {!selectedProject && (
                    <FormField
                      control={projectForm.control}
                      name="generateAiTasks"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 pt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
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
                        </FormItem>
                      )}
                    />
                )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsProjectFormOpen(false)} disabled={isAiLoading}>Cancel</Button>
                <Button type="submit" disabled={isAiLoading}>
                  {isAiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Task Form Dialog */}
      <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                <DialogDescription>{editingTask ? 'Update the details for this task.' : 'Fill in the details for the new task.'}</DialogDescription>
            </DialogHeader>
            <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4 py-4">
                <FormField control={taskForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={taskForm.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Task Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Recon">Recon</SelectItem><SelectItem value="Phishing">Phishing</SelectItem><SelectItem value="Payload">Payload</SelectItem><SelectItem value="Post-Exploitation">Post-Exploitation</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                    <FormField control={taskForm.control} name="priority" render={({ field }) => ( <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={taskForm.control} name="assignedTo" render={({ field }) => ( <FormItem><FormLabel>Assign To</FormLabel><Select onValueChange={(v) => field.onChange(v === 'unassigned' ? '' : v)} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Unassigned"/></SelectTrigger></FormControl><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{teamMembers.map(m => <SelectItem key={m.username} value={m.username}>{m.displayName}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                    <FormField control={taskForm.control} name="mitreTtp" render={({ field }) => ( <FormItem><FormLabel>MITRE ATT&amp;CK TTP</FormLabel><FormControl><Input placeholder="e.g., T1566.001" {...field} className="font-mono" /></FormControl></FormItem> )}/>
                 </div>
                {watchedTaskType === 'Phishing' && (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={taskForm.control} name="targetProfileId" render={({ field }) => ( <FormItem><FormLabel>Target Profile</FormLabel><Select onValueChange={(v) => { if (v === '__add_new__') { profileForm.reset(); setIsProfileFormOpen(true); } else { field.onChange(v); } }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Profile..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="__add_new__" className="text-accent">＋ Add New Profile...</SelectItem>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></FormItem> )}/>
                        <FormField control={taskForm.control} name="templateId" render={({ field }) => ( <FormItem><FormLabel>Message Template</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Template..." /></SelectTrigger></FormControl><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></FormItem> )}/>
                    </div>
                )}
                 <FormField
                    control={taskForm.control}
                    name="evidenceIds"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Link Evidence</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value && field.value.length > 0 ? `${field.value.length} file(s) selected` : "Select files..."}
                                <Paperclip className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                                <CommandInput placeholder="Search files..." />
                                <CommandEmpty>No files found.</CommandEmpty>
                                <CommandList>
                                    {allFiles.filter(f => f.type === 'file').map((file) => (
                                        <CommandItem
                                            key={file.id}
                                            value={file.name}
                                            onSelect={() => {
                                                const selected = field.value || [];
                                                const isSelected = selected.includes(file.id);
                                                field.onChange(isSelected ? selected.filter(id => id !== file.id) : [...selected, file.id]);
                                            }}
                                        >
                                            <CheckCircle2 className={`mr-2 h-4 w-4 ${(field.value || []).includes(file.id) ? "opacity-100" : "opacity-0"}`}/>
                                            {file.name}
                                        </CommandItem>
                                    ))}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                        </Popover>
                    </FormItem>
                    )}
                />
                 <FormField
                    control={taskForm.control}
                    name="dependsOn"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Dependencies</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                             <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value && field.value.length > 0 ? `${field.value.length} task(s) selected` : "Select prerequisite tasks..."}
                                <Lock className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                           <Command>
                            <CommandInput placeholder="Search tasks..." />
                            <CommandEmpty>No tasks found.</CommandEmpty>
                            <CommandList>
                               {tasks.filter(t => t.projectId === currentProjectIdForTask && t.id !== editingTask?.id).map((task) => (
                                    <CommandItem key={task.id} value={task.description} onSelect={() => {
                                        const selected = field.value || [];
                                        const isSelected = selected.includes(task.id);
                                        field.onChange(isSelected ? selected.filter(id => id !== task.id) : [...selected, task.id]);
                                    }}>
                                        <CheckCircle2 className={`mr-2 h-4 w-4 ${(field.value || []).includes(task.id) ? "opacity-100" : "opacity-0"}`}/>
                                        {task.description}
                                    </CommandItem>
                                ))}
                            </CommandList>
                           </Command>
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Task</Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      {/* Nested Profile Creation Dialog */}
      <Dialog open={isProfileFormOpen} onOpenChange={setIsProfileFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Target Profile</DialogTitle>
                <DialogDescription>Add a new target profile. It will be automatically selected for this task.</DialogDescription>
            </DialogHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleCreateNewProfile)} className="space-y-4 py-4">
                  <FormField control={profileForm.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={profileForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="grid grid-cols-2 gap-4">
                      <FormField control={profileForm.control} name="role" render={({ field }) => ( <FormItem><FormLabel>Role / Position</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={profileForm.control} name="company" render={({ field }) => ( <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                  <FormField control={profileForm.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Add any relevant notes for this target..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsProfileFormOpen(false)}>Cancel</Button>
                      <Button type="submit">Create Profile</Button>
                  </DialogFooter>
              </form>
            </Form>
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

    

    
