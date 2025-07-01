
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MoreHorizontal, Edit, Trash2, User as UserIcon } from 'lucide-react';

type Profile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  company: string;
  notes?: string;
};

const initialProfiles: Profile[] = [
  {
    id: 'PROF-001',
    fullName: 'Jane Doe',
    email: 'jane.doe@global-corp.com',
    role: 'Lead Accountant',
    company: 'Global-Corp Inc.',
    notes: 'Potential target for invoice-themed phishing campaigns. Attends weekly finance meetings on Tuesdays.'
  },
  {
    id: 'PROF-002',
    fullName: 'John Smith',
    email: 'j.smith@tech-conglomerate.io',
    role: 'Senior Developer',
    company: 'Tech Conglomerate',
    notes: 'Active on GitHub. Could be susceptible to technical lures or fake security alerts.'
  }
];

const profileSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  role: z.string().min(2, 'Role is required.'),
  company: z.string().min(2, 'Company is required.'),
  notes: z.string().optional(),
});

export default function ProfilingPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    try {
      const storedProfiles = localStorage.getItem('netra-profiles');
      if (storedProfiles) {
        setProfiles(JSON.parse(storedProfiles));
      } else {
        setProfiles(initialProfiles);
        localStorage.setItem('netra-profiles', JSON.stringify(initialProfiles));
      }
    } catch (error) {
      console.error('Failed to load profiles from localStorage', error);
      setProfiles(initialProfiles);
    }
  }, []);

  const updateProfiles = (newProfiles: Profile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem('netra-profiles', JSON.stringify(newProfiles));
  }

  const handleCreate = () => {
    setSelectedProfile(null);
    form.reset({
      fullName: '',
      email: '',
      role: '',
      company: '',
      notes: '',
    });
    setIsFormOpen(true);
  }

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    form.reset(profile);
    setIsFormOpen(true);
  }

  const handleDelete = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDeleteAlertOpen(true);
  }

  const confirmDelete = () => {
    if (selectedProfile) {
      const newProfiles = profiles.filter(p => p.id !== selectedProfile.id);
      updateProfiles(newProfiles);
      toast({ title: 'Profile Deleted', description: `Profile for "${selectedProfile.fullName}" has been removed.` });
      setIsDeleteAlertOpen(false);
      setSelectedProfile(null);
    }
  }

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    if (selectedProfile) { // Editing existing profile
      const updatedProfiles = profiles.map(p =>
        p.id === selectedProfile.id ? { ...p, ...values } : p
      );
      updateProfiles(updatedProfiles);
      toast({ title: 'Profile Updated', description: `Profile for "${values.fullName}" has been updated.` });
    } else { // Creating new profile
      const newProfile: Profile = {
        id: `PROF-${String(profiles.length + 1).padStart(3, '0')}`,
        ...values,
      }
      updateProfiles([...profiles, newProfile]);
      toast({ title: 'Profile Created', description: `New profile for "${values.fullName}" has been added.` });
    }
    setIsFormOpen(false);
    setSelectedProfile(null);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-semibold">Target Profiling</h1>
            <p className="text-muted-foreground">Create and manage profiles for engagement targets.</p>
          </div>
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Profile
          </Button>
        </div>

        {profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Card key={profile.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        {profile.fullName}
                    </CardTitle>
                    <CardDescription>{profile.role} at {profile.company}</CardDescription>
                  </div>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(profile)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(profile)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Email: <span className="text-muted-foreground font-normal">{profile.email}</span></p>
                        {profile.notes && (
                            <div>
                                <p className="text-sm font-medium">Notes:</p>
                                <p className="text-sm text-muted-foreground bg-primary/20 p-2 rounded-md">{profile.notes}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
            <Card className="flex flex-col items-center justify-center py-20">
                <CardHeader>
                    <CardTitle>No Profiles Yet</CardTitle>
                    <CardDescription>Click "New Profile" to get started.</CardDescription>
                </CardHeader>
            </Card>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProfile ? 'Edit Profile' : 'Create New Profile'}</DialogTitle>
            <DialogDescription>
              {selectedProfile ? `Update the details for "${selectedProfile.fullName}".` : 'Fill in the details for the new target profile.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...form.register('fullName')} />
                {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register('email')} />
                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="role">Role / Position</Label>
                  <Input id="role" {...form.register('role')} />
                  {form.formState.errors.role && <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" {...form.register('company')} />
                  {form.formState.errors.company && <p className="text-sm text-destructive">{form.formState.errors.company.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register('notes')} placeholder="Add any relevant notes for this target..."/>
              </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save Profile</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the profile for
              "{selectedProfile?.fullName}".
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
