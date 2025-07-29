
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, type User } from '@/hooks/use-auth';
import { Users } from 'lucide-react';

export function TeamStatus() {
  const { user: currentUser, users: teamMembers } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <Users />
          Team Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {teamMembers.map((member) => (
            <li key={member.username} className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={member.avatarUrl || ''} />
                  <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-card ${member.username === currentUser?.username ? 'bg-green-400' : 'bg-muted-foreground/50'}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{member.displayName}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
