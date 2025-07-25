
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, UserSettingsSchema, type UserSettings } from '@/services/user-settings-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Checkbox } from '../ui/checkbox';
import { sendWebhookNotification } from '@/actions/notification-actions';

export function NotificationsSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [settings, setSettings] = useState<UserSettings['notifications'] | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const userSettings = await getUserSettings();
      setSettings(userSettings.notifications);
    }
    loadSettings();
  }, [user]);
  
  const handleNestedChange = <K extends keyof UserSettings['notifications']>(
    key: K,
    value: UserSettings['notifications'][K]
  ) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };
  
  const handleEventToggle = (eventId: string, isChecked: boolean) => {
    if (!settings) return;
    const currentEvents = settings.webhookEvents;
    const newEvents = isChecked ? [...currentEvents, eventId] : currentEvents.filter(e => e !== eventId);
    handleNestedChange('webhookEvents', newEvents);
  };

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      const userSettings = await getUserSettings();
      const newSettings: UserSettings = {
        ...userSettings,
        notifications: settings,
      };
      
      UserSettingsSchema.parse(newSettings);
      updateUser(user.username, { userSettings: newSettings });
      toast({ title: 'Notification Settings Saved' });
    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ variant: 'destructive', title: 'Save Failed', description: error });
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTestWebhook = async () => {
    if (!settings?.webhookUrl) {
      toast({ variant: 'destructive', title: 'Webhook URL is not set.' });
      return;
    }
    setIsTesting(true);
    try {
        await sendWebhookNotification({ 
            webhookUrl: settings.webhookUrl, 
            message: `This is a test notification from NETRA-X at ${new Date().toLocaleTimeString()}`
        });
        toast({ title: 'Test Webhook Sent', description: 'Check your Discord/Slack channel.'});
    } catch (e) {
        toast({ variant: 'destructive', title: 'Test Failed', description: e instanceof Error ? e.message : 'Could not send test message.' });
    } finally {
        setIsTesting(false);
    }
  }

  if (!settings) {
    return null;
  }

  return (
    <AccordionItem value="notifications-settings">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <div className="text-left">
                <p className="font-semibold">Notifications & Alerts</p>
                <p className="text-sm text-muted-foreground font-normal">Configure webhook and email alerts for critical events.</p>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 border-t">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="font-semibold">Webhook Notifications (Discord, Slack, etc.)</Label>
               <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input id="webhookUrl" value={settings.webhookUrl} onChange={(e) => handleNestedChange('webhookUrl', e.target.value)} placeholder="https://discord.com/api/webhooks/..."/>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-sm">Notify on these events:</p>
                {['credential_captured', 'honeytrap_triggered', 'admin_login'].map((id) => (
                    <div className="flex items-center space-x-2" key={id}>
                        <Checkbox 
                            id={`event-${id}`}
                            checked={settings.webhookEvents.includes(id)}
                            onCheckedChange={(checked) => handleEventToggle(id, !!checked)}
                        />
                        <Label htmlFor={`event-${id}`} className="font-normal capitalize">{id.replace(/_/g, ' ')}</Label>
                    </div>
                 ))}
              </div>
               <Button onClick={handleTestWebhook} disabled={isTesting || !settings.webhookUrl} variant="outline" className="w-full">
                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Send Test Webhook
              </Button>
            </div>

            <div className="space-y-4">
               <Label className="font-semibold">Email Alerts</Label>
               <div className="flex items-center space-x-2">
                    <Checkbox id="email-on-assign" checked={settings.emailOnTaskAssignment} onCheckedChange={(c) => handleNestedChange('emailOnTaskAssignment', !!c)} />
                    <Label htmlFor="email-on-assign" className="font-normal">Send email when a task is assigned to me</Label>
                </div>
                 <p className="text-xs text-muted-foreground">This requires SMTP settings to be configured correctly.</p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notification Settings
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
