
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserTable } from '@/components/user-table';
import { ROLES } from '@/lib/constants';


export default function UserManagementPage() {
    const { user } = useAuth();
    
    // This is a client component, but we can still gate access
    if (user?.role !== ROLES.ADMIN) {
        return (
            <div className="flex flex-col gap-6">
                <h1 className="font-headline text-3xl font-semibold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        );
    }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">User Management</h1>
        <p className="text-muted-foreground">Administer user accounts, roles, and module access.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>View, edit, and manage user roles and access.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable />
        </CardContent>
      </Card>
    </div>
  );
}
