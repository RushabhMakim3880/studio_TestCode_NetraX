
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MoreHorizontal, Edit, Trash2, CornerDownRight, MessageSquare, Link as LinkIcon, Lock, Flag, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from './ui/textarea';
import type { Task, Comment } from '@/app/(app)/project-management/page';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { formatDistanceToNow } from 'date-fns';

const taskStatusIcons: { [key in Task['status']]: React.ReactNode } = {
  'To Do': <Circle className="h-4 w-4 text-muted-foreground" />,
  'In Progress': <CircleDot className="h-4 w-4 text-sky-400" />,
  'Completed': <CheckCircle2 className="h-4 w-4 text-green-400" />,
};

const priorityColors: { [key in Task['priority']]: string } = {
    'Low': 'text-sky-400',
    'Medium': 'text-amber-400',
    'High': 'text-orange-500',
    'Critical': 'text-destructive',
};

function TaskComments({ taskId }: { taskId: string }) {
    const { user: currentUser } = useAuth();
    const { value: comments, setValue: setComments } = useLocalStorage<Comment[]>('netra-comments', []);
    const [newComment, setNewComment] = useState('');

    const taskComments = comments.filter(c => c.taskId === taskId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

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
            <Accordion type="single" collapsible>
                <AccordionItem value="comments" className="border-b-0">
                    <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-1">
                        <div className="flex items-center gap-2">
                           <MessageSquare className="h-4 w-4" />
                           <span>{taskComments.length} Comments</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                         {taskComments.map(comment => (
                            <div key={comment.id} className="flex items-start gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={comment.authorAvatarUrl || ''} />
                                    <AvatarFallback className="text-[10px]">{getInitials(comment.authorName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-background rounded-md p-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-bold">{comment.authorName}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                                    </div>
                                    <p className="text-sm">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                         <div className="flex gap-2 pt-2">
                            <Textarea 
                                value={newComment} 
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="text-sm h-16"
                            />
                            <Button onClick={handlePostComment} size="sm">Post</Button>
                         </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}


interface TaskCardProps {
    task: Task;
    allTasks: Task[];
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onAddSubtask: (parentId: string) => void;
    onUpdateStatus: (taskId: string, status: Task['status']) => void;
    level?: number;
}

export function TaskCard({ task, allTasks, onEdit, onDelete, onAddSubtask, onUpdateStatus, level = 0 }: TaskCardProps) {
    const { users: teamMembers } = useAuth();
    const { toast } = useToast();

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

    const isBlocked = getIsBlocked(task);
    const assignee = getAssignee(task.assignedTo);
    const subTasks = allTasks.filter(t => t.parentTaskId === task.id);
    
    const handleStatusChange = (newStatus: Task['status']) => {
        if (isBlocked && newStatus !== 'To Do') {
            toast({ variant: 'destructive', title: 'Task Blocked', description: 'Complete all dependencies before changing status.'});
            return;
        }
        onUpdateStatus(task.id, newStatus);
    }

    return (
        <div style={{ marginLeft: `${level * 1.5}rem`}} className="space-y-2">
            <Card className="p-3 bg-background/50 group">
                <div className="flex items-start justify-between text-sm">
                    <div className="flex-grow flex items-start gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">{taskStatusIcons[task.status]}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {Object.keys(taskStatusIcons).map((status) => (
                                    <DropdownMenuItem key={status} onClick={() => handleStatusChange(status as Task['status'])}>
                                        {taskStatusIcons[status as Task['status']]} <span>{status}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                         
                        <div className="flex-grow">
                           <p className={`font-medium ${isBlocked ? 'text-muted-foreground line-through' : ''}`}>{task.description}</p>
                           <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <Badge variant="outline">{task.type}</Badge>
                                <TooltipProvider><Tooltip><TooltipTrigger>
                                  <Flag className={`h-3 w-3 ${priorityColors[task.priority]}`} />
                                </TooltipTrigger><TooltipContent><p>{task.priority} Priority</p></TooltipContent></Tooltip></TooltipProvider>
                                {assignee && (
                                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                    <Avatar className="h-4 w-4"><AvatarImage src={assignee.avatarUrl || ''} /><AvatarFallback className="text-[8px]">{getInitials(assignee.displayName)}</AvatarFallback></Avatar>
                                    </TooltipTrigger><TooltipContent><p>Assigned to {assignee.displayName}</p></TooltipContent></Tooltip></TooltipProvider>
                                )}
                                 {isBlocked && (
                                    <TooltipProvider><Tooltip><TooltipTrigger>
                                        <Lock className="h-3 w-3 text-muted-foreground"/>
                                    </TooltipTrigger><TooltipContent>
                                        <p>Blocked by {task.dependsOn?.length} task(s)</p>
                                    </TooltipContent></Tooltip></TooltipProvider>
                                )}
                            </div>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(task)}><Edit className="mr-2 h-4 w-4" /> Edit Task</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddSubtask(task.id)}><CornerDownRight className="mr-2 h-4 w-4" /> Add Sub-task</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete Task</DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                </div>
                 {task.id && <TaskComments taskId={task.id} />}
            </Card>
            <div className="pl-4 border-l-2 ml-4 space-y-2">
                {subTasks.map(subTask => <TaskCard key={subTask.id} task={subTask} allTasks={allTasks} onEdit={onEdit} onDelete={onDelete} onAddSubtask={onAddSubtask} onUpdateStatus={onUpdateStatus} level={0} />)}
            </div>
        </div>
    );
};
