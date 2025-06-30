'use client';

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/lib/constants';

type User = {
  username: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('netra-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('netra-user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('netra-user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
  };

  const register = (userData: User) => {
    // In a real app, this would hit an API endpoint.
    // Here we'll just log them in directly.
    localStorage.setItem('netra-user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('netra-user');
    setUser(null);
    router.push('/login');
  };

  const value = { user, login, logout, register, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
