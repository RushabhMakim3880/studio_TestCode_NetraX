
'use client';

import { useState } from 'react';
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const loginSchema = z.object({
  username: z.string().min(2, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
  twoFactorCode: z.string().optional(),
});

const registerSchema = z.object({
  username: z.string().min(2, { message: 'Username must be at least 2 characters.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }),
  role: z.nativeEnum(ROLES, { errorMap: () => ({ message: 'Please select a valid role.' }) }),
});

type AuthFormProps = {
  mode: 'login' | 'register';
};

// This component is now only used for registration. Login is handled by AnimatedLoginForm.
export function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [show2fa, setShow2fa] = useState(false);

  const isLogin = mode === 'login';
  const schema = isLogin ? loginSchema : registerSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
      ...(isLogin ? {} : { displayName: '', role: ROLES.OPERATOR }),
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      if (isLogin) {
        const result = await login(values);
        if (result.twoFactorRequired) {
          setShow2fa(true);
        }
      } else {
        await register(values as any);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
      form.setError('root', { message: error instanceof Error ? error.message : 'An unknown error occurred.' });
      setShow2fa(false);
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
            {!show2fa && (
              <>
                {!isLogin && 'displayName' in form.control.getValues() && (
                  <FormField control={form.control} name="displayName" render={({ field }) => (<FormItem><FormLabel>Display Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
                <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username (for login)</FormLabel><FormControl><Input placeholder="operator_id" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
                {!isLogin && 'role' in form.control.getValues() && (
                  <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{Object.values(ROLES).map((role) => (<SelectItem key={role} value={role}>{role}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                )}
              </>
            )}

            {show2fa && (
              <FormField
                control={form.control}
                name="twoFactorCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Two-Factor Code</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup className="w-full">
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
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
              {show2fa ? 'Verify Code' : isLogin ? 'Login' : 'Register'}
            </Button>
            
            {show2fa && (
                <Button variant="link" size="sm" className="w-full" onClick={() => setShow2fa(false)}>Back to login</Button>
            )}
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {isLogin ? (
            <span>Don&apos;t have an account?{' '}
              <Link href="/register" className="underline text-accent/80 hover:text-accent">Register</Link>
            </span>
          ) : (
            <span>Already have an account?{' '}
              <Link href="/login" className="underline text-accent/80 hover:text-accent">Login</Link>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
