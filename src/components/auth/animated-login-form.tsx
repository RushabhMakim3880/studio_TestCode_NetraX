
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
  twoFactorCode: z.string().optional(),
});

export function AnimatedLoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [show2fa, setShow2fa] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const result = await login(values);
      if (result.twoFactorRequired && !show2fa) {
        setShow2fa(true);
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

  // Generate spans for the background animation
  const backgroundSpans = Array.from({ length: 258 });

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
        .login-section {
          position: absolute;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2px;
          flex-wrap: wrap;
          overflow: hidden;
        }
        .login-section::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(#000, #0f0, #000);
          animation: animate 5s linear infinite;
        }
        @keyframes animate {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .login-section span {
          position: relative;
          display: block;
          width: calc(6.25vw - 2px);
          height: calc(6.25vw - 2px);
          background: #181818;
          z-index: 2;
          transition: 1.5s;
        }
        .login-section span:hover {
          background: #0f0;
          transition: 0s;
        }
        .signin {
          position: absolute;
          width: 400px;
          background: #222;  
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
          border-radius: 4px;
          box-shadow: 0 15px 35px rgba(0,0,0,9);
        }
        .signin .content {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          gap: 40px;
        }
        .signin .content h2 {
          font-size: 2em;
          color: #0f0;
          text-transform: uppercase;
        }
        .signin .content .form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        .signin .content .form .inputBox {
          position: relative;
          width: 100%;
        }
        .signin .content .form .inputBox input {
          position: relative;
          width: 100%;
          background: #333;
          border: none;
          outline: none;
          padding: 25px 10px 7.5px;
          border-radius: 4px;
          color: #fff;
          font-weight: 500;
          font-size: 1em;
        }
        .signin .content .form .inputBox i {
          position: absolute;
          left: 0;
          padding: 15px 10px;
          font-style: normal;
          color: #aaa;
          transition: 0.5s;
          pointer-events: none;
        }
        .signin .content .form .inputBox input:focus ~ i,
        .signin .content .form .inputBox input:valid ~ i {
          transform: translateY(-7.5px);
          font-size: 0.8em;
          color: #fff;
        }
        .signin .content .form .links {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: space-between;
        }
        .signin .content .form .links a {
          color: #fff;
          text-decoration: none;
        }
        .signin .content .form .links a:nth-child(2) {
          color: #0f0;
          font-weight: 600;
        }
        .signin .content .form .inputBox input[type="submit"] {
          padding: 10px;
          background: #0f0;
          color: #000;
          font-weight: 600;
          font-size: 1.35em;
          letter-spacing: 0.05em;
          cursor: pointer;
        }
        .signin .content .form .inputBox input[type="submit"]:active {
          opacity: 0.6;
        }
        @media (max-width: 900px) {
          .login-section span {
            width: calc(10vw - 2px);
            height: calc(10vw - 2px);
          }
        }
        @media (max-width: 600px) {
          .login-section span {
            width: calc(20vw - 2px);
            height: calc(20vw - 2px);
          }
        }
        #twoFactorCode { 
            letter-spacing: 1.5rem; 
            text-align: center;
        }
      `}</style>
      <section className="login-section">
        {backgroundSpans.map((_, i) => <span key={i}></span>)}
        <div className="signin"> 
          <div className="content"> 
            <h2>{show2fa ? 'Enter 2FA Code' : 'Sign In'}</h2> 
            <form onSubmit={form.handleSubmit(onSubmit)} className="form">
              {!show2fa ? (
                <>
                  <div className="inputBox"> 
                    <input {...form.register('username')} type="text" required /> 
                    <i>Username</i> 
                  </div> 
                  <div className="inputBox"> 
                    <input {...form.register('password')} type="password" required /> 
                    <i>Password</i> 
                  </div> 
                  <div className="links"> 
                    <a href="#">Forgot Password</a> 
                    <Link href="/register">Signup</Link>
                  </div>
                </>
              ) : (
                 <div className="inputBox">
                    <input {...form.register('twoFactorCode')} id="twoFactorCode" type="text" required maxLength={6} autoComplete="off"/>
                    <i>Verification Code</i>
                 </div>
              )}
               {form.formState.errors.root && (
                 <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
              )}
              <div className="inputBox"> 
                <input type="submit" value={show2fa ? 'Verify' : 'Login'} disabled={form.formState.isSubmitting} /> 
              </div>
              {show2fa && <button type="button" onClick={() => setShow2fa(false)} className="text-sm text-gray-400 hover:text-white">Back to login</button>}
            </form>
          </div> 
        </div> 
      </section>
    </>
  );
}
