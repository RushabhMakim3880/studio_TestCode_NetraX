'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, type Role } from '@/lib/constants';
import { Logo } from '../logo';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const formSchemaBase = {
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
};

const loginSchema = z.object(formSchemaBase);

const registerSchema = z.object({
  ...formSchemaBase,
  role: z.nativeEnum(ROLES, {
    errorMap: () => ({ message: 'Please select a valid role.' }),
  }),
});

type AuthFormProps = {
  mode: 'login' | 'register';
};

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth();
  const { toast } = useToast();

  const isLogin = mode === 'login';
  const schema = isLogin ? loginSchema : registerSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
      ...(isLogin ? {} : { role: ROLES.OPERATOR }),
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      if (isLogin) {
        await login(values);
      } else {
        await register(values as { username: string; password: any; role: Role });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
      form.setError('root', { message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 shadow-2xl shadow-black/30">
      <CardHeader className="items-center text-center">
        <Logo className="mb-2" />
        <CardTitle className="font-headline text-2xl">{isLogin ? 'Operator Login' : 'Create Account'}</CardTitle>
        <CardDescription>{isLogin ? 'Enter your credentials to access the system.' : 'Register for system access.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="operator_id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isLogin && 'role' in form.control.getValues() && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ROLES).map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             {form.formState.errors.root && (
                <FormMessage>{form.formState.errors.root.message}</FormMessage>
            )}
            <Button type="submit" className="w-full !mt-6 bg-accent text-accent-foreground hover:bg-accent/90" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'Login' : 'Register'}
            </Button>
          </form>
        </Form>
         <div className="mt-4 text-center text-sm">
            {isLogin ? (
                <span>Don&apos;t have an account?{' '}
                    <Link href="/register" className="underline text-accent/80 hover:text-accent">
                        Register
                    </Link>
                </span>
            ) : (
                <span>Already have an account?{' '}
                    <Link href="/login" className="underline text-accent/80 hover:text-accent">
                        Login
                    </Link>
                </span>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
