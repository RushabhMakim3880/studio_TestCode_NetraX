
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { PREMADE_AVATARS } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Upload, Check } from 'lucide-react';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

type AvatarManagerProps = {
  currentAvatar: string | null;
  onAvatarChange: (url: string) => void;
};

export function AvatarManager({ currentAvatar, onAvatarChange }: AvatarManagerProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'Image Too Large', description: 'Please select an image under 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onAvatarChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-32 w-32 text-4xl">
          {currentAvatar && <AvatarImage src={currentAvatar} alt={user?.displayName || 'User Avatar'} />}
          <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
        </Avatar>
        <Button variant="outline" onClick={handleUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Photo
        </Button>
        <Input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
      </div>

      <div>
        <h4 className="text-center text-sm font-medium text-muted-foreground mb-4">Or select a premade avatar</h4>
        <div className="grid grid-cols-3 gap-4">
          {PREMADE_AVATARS.map((avatar, index) => (
            <button
              key={index}
              className={cn(
                "relative rounded-full aspect-square flex items-center justify-center transition-all ring-offset-background ring-offset-2 focus:outline-none focus-visible:ring-2",
                currentAvatar === avatar ? 'ring-2 ring-accent' : 'hover:ring-2 hover:ring-border'
              )}
              onClick={() => onAvatarChange(avatar)}
            >
              <Image src={avatar} alt={`Premade Avatar ${index + 1}`} width={128} height={128} className="rounded-full" />
              {currentAvatar === avatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Check className="h-8 w-8 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
