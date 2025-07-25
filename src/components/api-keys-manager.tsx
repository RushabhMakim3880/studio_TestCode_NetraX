
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, PlusCircle, Trash2, Edit, Info, Server } from 'lucide-react';
import { getApiKeys, saveApiKeys, ApiKeySettings } from '@/services/api-key-service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const addKeySchema = z.object({
    keyName: z.string().min(1, 'Key name is required.').refine(val => /^[A-Z0-9_]+$/.test(val), {
        message: 'Key name must be uppercase letters, numbers, and underscores only (e.g., MY_API_KEY).'
    }),
    keyValue: z.string().min(1, 'Key value is required.'),
});

type ApiKeyEntryProps = {
    keyName: string;
    value: string;
    isEnvVar?: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

const ApiKeyEntry = ({ keyName, value, isEnvVar, onEdit, onDelete }: ApiKeyEntryProps) => (
    <div className="flex items-center justify-between p-3 border rounded-md bg-primary/20">
        <div>
            <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-semibold">{keyName}</p>
                {isEnvVar && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Server className="h-4 w-4 text-muted-foreground"/>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This key is set via an environment variable and cannot be edited here.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <p className="font-mono text-xs text-muted-foreground">{'*'.repeat(value.length)}</p>
        </div>
        {!isEnvVar && (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )}
    </div>
);

export function ApiKeysManager() {
  const { toast } = useToast();
  const [userDefinedKeys, setUserDefinedKeys] = useState<ApiKeySettings>({});
  const [envKeys, setEnvKeys] = useState<ApiKeySettings>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const addKeyForm = useForm<z.infer<typeof addKeySchema>>({ resolver: zodResolver(addKeySchema) });

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const { userDefined, environment } = await getApiKeys();
      setUserDefinedKeys(userDefined);
      setEnvKeys(environment);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Could not load API keys.';
      toast({ variant: 'destructive', title: 'Loading Failed', description: error });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await saveApiKeys(userDefinedKeys);
        toast({ title: 'API Keys Saved', description: 'Your custom API keys have been securely stored.' });
        // After saving, reload to ensure state is consistent
        await loadKeys();
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Save Failed', description: error });
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddNewKey = (values: z.infer<typeof addKeySchema>) => {
    if (userDefinedKeys.hasOwnProperty(values.keyName) || envKeys.hasOwnProperty(values.keyName)) {
        addKeyForm.setError('keyName', { message: 'This key name already exists.' });
        return;
    }
    setUserDefinedKeys(prev => ({ ...prev, [values.keyName]: values.keyValue }));
    setIsAddModalOpen(false);
    addKeyForm.reset();
  }
  
  const handleEditKey = () => {
      if (selectedKey) {
          setUserDefinedKeys(prev => ({ ...prev, [selectedKey]: editValue }));
          setIsEditModalOpen(false);
          setSelectedKey(null);
          setEditValue('');
      }
  }
  
  const handleDeleteKey = () => {
      if (selectedKey) {
          const newSettings = { ...userDefinedKeys };
          delete newSettings[selectedKey];
          setUserDefinedKeys(newSettings);
          setIsDeleteAlertOpen(false);
          setSelectedKey(null);
      }
  }

  const allKeys = { ...envKeys, ...userDefinedKeys };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <KeyRound className="h-6 w-6" />
            <CardTitle>API Key Management</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Key
            </Button>
        </div>
        <CardDescription>Manage third-party API keys. User-defined keys are stored in <code className="font-mono bg-primary/10 p-1 rounded-sm">.secrets.json</code> and will override any matching environment variables.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        ) : (
            <div className="space-y-4">
                {Object.keys(allKeys).length > 0 ? (
                    Object.entries(allKeys).map(([key, value]) => {
                        const isEnv = envKeys.hasOwnProperty(key);
                        return (
                            <ApiKeyEntry 
                                key={key}
                                keyName={key}
                                value={value}
                                isEnvVar={isEnv}
                                onEdit={() => { setSelectedKey(key); setEditValue(value); setIsEditModalOpen(true); }}
                                onDelete={() => { setSelectedKey(key); setIsDeleteAlertOpen(true); }}
                            />
                        );
                    })
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-8">No API keys configured. Click "Add New Key" to get started.</p>
                )}
            </div>
        )}
      </CardContent>
       <CardFooter className="justify-end border-t pt-6">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
    </Card>

    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New API Key</DialogTitle>
                <DialogDescription>Add a new secret key to be stored on the server.</DialogDescription>
            </DialogHeader>
            <form onSubmit={addKeyForm.handleSubmit(handleAddNewKey)} className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input id="keyName" {...addKeyForm.register('keyName')} placeholder="e.g., SHODAN_API_KEY" className="font-mono" />
                    {addKeyForm.formState.errors.keyName && <p className="text-sm text-destructive">{addKeyForm.formState.errors.keyName.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="keyValue">Key Value</Label>
                    <Input id="keyValue" {...addKeyForm.register('keyValue')} type="password" />
                    {addKeyForm.formState.errors.keyValue && <p className="text-sm text-destructive">{addKeyForm.formState.errors.keyValue.message}</p>}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Add Key</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit API Key</DialogTitle>
                <DialogDescription>Update the value for <span className="font-mono text-accent">{selectedKey}</span>.</DialogDescription>
            </DialogHeader>
             <div className="py-4 space-y-2">
                <Label htmlFor="editKeyValue">New Value</Label>
                <Input id="editKeyValue" value={editValue} onChange={(e) => setEditValue(e.target.value)} type="password" />
            </div>
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleEditKey}>Save Value</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the <span className="font-mono text-accent">{selectedKey}</span> key.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey} className="bg-destructive hover:bg-destructive/90">
            Delete
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
