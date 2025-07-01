'use client';

import { useState, useEffect } from 'react';
import { useAuth, type User } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
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
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ROLES, Role } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';


export function UserTable() {
    const { users, updateUser, deleteUser, user: currentUser } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { toast } = useToast();

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
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

    const handleRoleChange = (role: Role) => {
        if(selectedUser) {
            setSelectedUser({...selectedUser, role});
        }
    }

    const handleSaveChanges = () => {
        if (selectedUser) {
            updateUser(selectedUser.username, { role: selectedUser.role });
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

  return (
    <>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {users.map((user) => (
                <TableRow key={user.username}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                <TableCell>{user.lastLogin || 'N/A'}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(user)}><Edit className="mr-2 h-4 w-4" /> Edit Role</DropdownMenuItem>
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
                    <DialogDescription>Change the role for this user.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="role">Role</Label>
                    <Select value={selectedUser?.role} onValueChange={(value: Role) => handleRoleChange(value)}>
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
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user account
                        for <span className="font-bold">{selectedUser?.username}</span>.
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
