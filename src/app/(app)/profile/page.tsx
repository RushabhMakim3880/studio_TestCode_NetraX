
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, KeyRound, Palette } from 'lucide-react';
import { AvatarManager } from '@/components/avatar-manager';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

const profileFormSchema = z.object({
    displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }),
});


export default function ProfilePage() {
  const { user, updateUser, changePassword } = useAuth();
  const { toast } = useToast();

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: { displayName: user?.displayName || '' },
  });

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast({ title: 'Success!', description: 'Your password has been changed.' });
      passwordForm.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Password Change Failed', description: errorMessage });
      passwordForm.setError('currentPassword', { message: errorMessage });
    }
  }
  
  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
      if(!user) return;
      try {
          updateUser(user.username, { displayName: values.displayName });
          toast({ title: 'Success!', description: 'Your display name has been updated.' });
      } catch (error) {
           const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
           toast({ variant: 'destructive', title: 'Update Failed', description: errorMessage });
      }
  }

  const handleAvatarChange = (avatarUrl: string) => {
    if (!user) return;
    try {
      updateUser(user.username, { avatarUrl });
      toast({ title: 'Avatar Updated!', description: 'Your new avatar has been saved.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Update Failed', description: errorMessage });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">User Profile & Settings</h1>
        <p className="text-muted-foreground">View your profile information and manage your account settings.</p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid gap-6">
           <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <User className="h-6 w-6" />
                    <CardTitle>Profile Details</CardTitle>
                </div>
                <CardDescription>Manage your display name and view your login username.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormItem>
                            <FormLabel>Username (Login ID)</FormLabel>
                            <Input value={user.username} readOnly disabled className="font-mono"/>
                            <FormDescription>Your username cannot be changed.</FormDescription>
                        </FormItem>
                        <FormField
                            control={profileForm.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={profileForm.formState.isSubmitting || !profileForm.formState.isDirty}>
                            {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Profile
                        </Button>
                    </form>
                </Form>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <KeyRound className="h-6 w-6" />
                    <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Update your account password. Use a strong, unique password.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={passwordForm.formState.isSubmitting}>
                            {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Palette className="h-6 w-6" />
                        <CardTitle>Avatar</CardTitle>
                    </div>
                    <CardDescription>Choose or upload your profile picture.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AvatarManager currentAvatar={user.avatarUrl} onAvatarChange={handleAvatarChange} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
