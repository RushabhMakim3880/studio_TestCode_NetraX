
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ArrowRight, Users } from 'lucide-react';
import { useAuth, type Role } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import { Badge } from '../ui/badge';

export function UserStats() {
  const { users } = useAuth();
  
  const roleOrder: Role[] = [ROLES.ADMIN, ROLES.ANALYST, ROLES.OPERATOR, ROLES.AUDITOR];
  
  const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
  }, {} as Record<Role, number>);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-3">
              <Users /> User Management
            </div>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/user-management"><ArrowRight className="h-4 w-4" /></Link>
            </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between space-y-4">
        <div className="text-center">
            <p className="text-4xl font-bold">{users.length}</p>
            <p className="text-sm text-muted-foreground">Total Users in System</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
           {roleOrder.map(role => (
               <div key={role} className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">{role}s</span>
                   <Badge variant="secondary" className="font-mono">{roleCounts[role] || 0}</Badge>
               </div>
           ))}
        </div>
      </CardContent>
    </Card>
  );
}
