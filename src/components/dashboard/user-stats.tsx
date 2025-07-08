'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function UserStats() {
  const { users } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg"><Users />User Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
            <p className="text-4xl font-bold">{users.length}</p>
            <p className="text-sm text-muted-foreground">Total Users in System</p>
        </div>
        <Button asChild className="w-full">
          <Link href="/user-management">
            Manage Users <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
