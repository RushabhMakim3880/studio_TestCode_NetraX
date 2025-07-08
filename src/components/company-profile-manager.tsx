'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building } from 'lucide-react';
import { Textarea } from './ui/textarea';

export type CompanyProfile = {
  name: string;
  address: string;
  contact: string;
  logoDataUrl: string | null;
};

export function CompanyProfileManager() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile>({ name: 'NETRA-X Security', address: '123 Cyber Street, Suite 404\nDigital City, DC 54321', contact: 'contact@netrax.local', logoDataUrl: null });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('netra-company-profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
    } catch (e) {
      console.error("Failed to load company profile from localStorage.", e);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for logo
        toast({ variant: 'destructive', title: 'Logo too large', description: 'Please select an image smaller than 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile(prev => ({ ...prev, logoDataUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('netra-company-profile', JSON.stringify(profile));
    setTimeout(() => {
      toast({ title: 'Company Profile Saved' });
      setIsSaving(false);
    }, 500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Building className="h-6 w-6" />
          <CardTitle>Company Profile & Letterhead</CardTitle>
        </div>
        <CardDescription>Customize details that will appear on generated documents.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="name" value={profile.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Textarea id="companyAddress" name="address" value={profile.address} onChange={handleInputChange} className="h-24" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyContact">Contact Info (Email/Phone)</Label>
              <Input id="companyContact" name="contact" value={profile.contact} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyLogo">Company Logo</Label>
            <Input id="companyLogo" type="file" accept="image/png, image/jpeg" onChange={handleLogoChange} />
            <CardDescription>Recommended: PNG with transparent background, under 5MB.</CardDescription>
            {profile.logoDataUrl && (
              <div className="mt-4 p-4 border rounded-md flex items-center justify-center bg-primary/10 h-40">
                <Image src={profile.logoDataUrl} alt="Company Logo Preview" width={150} height={150} className="max-h-[120px] w-auto object-contain" />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t mt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
