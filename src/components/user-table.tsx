
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, type User } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit, UserPlus, Send, Loader2, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES, type Role, APP_MODULES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateInviteEmail, type InviteUserOutput } from '@/ai/flows/invite-user-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logActivity } from '@/services/activity-log-service';

const inviteSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
    role: z.nativeEnum(ROLES),
});

export function UserTable() {
    const { users, updateUser, deleteUser, user: currentUser } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editableModules, setEditableModules] = useState<string[]>([]);
    
    const { toast } = useToast();
    
    const [inviteStep, setInviteStep] = useState<'form' | 'preview'>('form');
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
    const [generatedInvite, setGeneratedInvite] = useState<InviteUserOutput | null>(null);

    const inviteForm = useForm<z.infer<typeof inviteSchema>>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { email: '', role: ROLES.OPERATOR },
    });

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        // Ensure enabledModules is an array, falling back to an empty one if not set
        setEditableModules(user.enabledModules || []);
        setIsEditModalOpen(true);
    }
    
    const handleDeleteClick = (user: User) => {
        if (user.username === currentUser?.username) {
            toast({ variant: "destructive", title: "Error", description: "You cannot delete your own account."});
            return;
        }
        setSelectedUser(user);
        setIsDeleteAlertOpen(true);
    }

    const handleSaveChanges = () => {
        if (selectedUser) {
            updateUser(selectedUser.username, { role: selectedUser.role, enabledModules: editableModules });
            toast({ title: "Success", description: `User ${selectedUser.username} updated.` });
            setIsEditModalOpen(false);
            setSelectedUser(null);
        }
    }

    const confirmDelete = () => {
        if (selectedUser) {
            deleteUser(selectedUser.username);
            toast({ title: "Success", description: `User ${selectedUser.username} deleted.` });
            setIsDeleteAlertOpen(false);
            setSelectedUser(null);
        }
    }
    
    const handleOpenInviteModal = () => {
        setInviteStep('form');
        inviteForm.reset();
        setGeneratedInvite(null);
        setIsInviteModalOpen(true);
    };

    const onInviteSubmit = async (values: z.infer<typeof inviteSchema>) => {
        setIsGeneratingInvite(true);
        try {
            const response = await generateInviteEmail({
                recipientEmail: values.email,
                role: values.role,
                inviterName: currentUser?.displayName || 'Admin',
            });
            setGeneratedInvite(response);
            setInviteStep('preview');
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate invitation email.' });
            console.error(e);
        } finally {
            setIsGeneratingInvite(false);
        }
    };
    
    const handleSendInvite = () => {
        const values = inviteForm.getValues();
        logActivity({
            user: currentUser?.displayName || 'Admin',
            action: 'Sent User Invite',
            details: `Invited: ${values.email}, Role: ${values.role}`
        });
        toast({ title: "Invite Sent (Simulated)", description: `An invitation has been sent to ${values.email}.` });
        setIsInviteModalOpen(false);
    }

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
   const handleModuleToggle = (moduleName: string, isChecked: boolean) => {
        setEditableModules(prev => 
            isChecked ? [...prev, moduleName] : prev.filter(m => m !== moduleName)
        );
    };

  return (
    <>
        <div className="flex justify-end mb-4">
            <Button onClick={handleOpenInviteModal}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite User
            </Button>
        </div>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Enabled Modules</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {users.map((user) => (
                <TableRow key={user.username}>
                <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p>{user.displayName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.username}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.enabledModules?.length || 0} modules</TableCell>
                <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(user)}><Edit className="mr-2 h-4 w-4" /> Edit Role & Permissions</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(user)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Edit User: {selectedUser?.displayName}</DialogTitle>
                    <DialogDescription>Change the role and fine-tune module access for this user.</DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select 
                                value={selectedUser?.role} 
                                onValueChange={(value: Role) => setSelectedUser(prev => prev ? {...prev, role: value} : null)}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(ROLES).map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <p className="text-sm text-muted-foreground">Changing the role will not automatically change module permissions. Please review them manually.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Module Permissions</Label>
                        <Card className="max-h-80">
                           <ScrollArea className="h-80">
                               <CardContent className="p-4">
                                <Accordion type="multiple" className="w-full" defaultValue={APP_MODULES.map(m => m.name)}>
                                {APP_MODULES.filter(m => m.roles.includes(selectedUser?.role || ROLES.OPERATOR)).map(module => (
                                    <AccordionItem value={module.name} key={module.name}>
                                        <AccordionTrigger className="text-base py-2">
                                            <div className="flex items-center gap-2">
                                                <module.icon className="h-4 w-4" />
                                                {module.name}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pl-4 space-y-2">
                                            {module.subModules ? module.subModules.map(sub => (
                                                <div key={sub.name} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`${module.name}-${sub.name}`}
                                                        checked={editableModules.includes(sub.name)}
                                                        onCheckedChange={(checked) => handleModuleToggle(sub.name, !!checked)}
                                                    />
                                                    <label htmlFor={`${module.name}-${sub.name}`} className="text-sm font-normal">{sub.name}</label>
                                                </div>
                                            )) : (
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={module.name}
                                                        checked={editableModules.includes(module.name)}
                                                        onCheckedChange={(checked) => handleModuleToggle(module.name, !!checked)}
                                                    />
                                                    <label htmlFor={module.name} className="text-sm font-normal">Enable Base Module</label>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                                </Accordion>
                               </CardContent>
                           </ScrollArea>
                        </Card>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogContent className="sm:max-w-[600px]">
                 {inviteStep === 'form' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Invite New User</DialogTitle>
                            <DialogDescription>Send an invitation email to a new user to join the platform.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" {...inviteForm.register('email')} />
                                {inviteForm.formState.errors.email && <p className="text-sm text-destructive">{inviteForm.formState.errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-role">Role</Label>
                                <Select onValueChange={(v: Role) => inviteForm.setValue('role', v)} defaultValue={inviteForm.getValues('role')}>
                                    <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.values(ROLES).map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isGeneratingInvite}>
                                    {isGeneratingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Generate Invite
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                 )}
                 {inviteStep === 'preview' && generatedInvite && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Review Invitation</DialogTitle>
                            <DialogDescription>An email will be sent to <span className="font-semibold">{inviteForm.getValues('email')}</span>. This is a simulation.</DialogDescription>
                        </DialogHeader>
                        <div className="my-4 border rounded-md p-4 space-y-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold">Subject</h4>
                                <p className="text-sm p-2 bg-primary/20 rounded-md">{generatedInvite.subject}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold">Body Preview</h4>
                                <div className="p-2 bg-primary/20 rounded-md max-h-60 overflow-y-auto">
                                    <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: generatedInvite.body }} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setInviteStep('form')}>Back</Button>
                            <Button onClick={handleSendInvite}>
                                <Send className="mr-2 h-4 w-4" /> Send Invite
                            </Button>
                        </DialogFooter>
                    </>
                 )}
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user account
                        for <span className="font-bold">{selectedUser?.displayName}</span>.
                    </AlertDialogDescription>
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
