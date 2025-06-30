import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserTable } from '@/components/user-table';

export default function UserManagementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">User Management</h1>
        <p className="text-muted-foreground">Administer user accounts and roles.</p>
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
