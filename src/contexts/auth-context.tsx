
'use client';

import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES, type Role, getAllModuleNamesForRole } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_DASHBOARD_LAYOUT } from '@/lib/dashboard-cards';
import { defaultPageSettings, type PageSettings } from '@/components/settings/page-settings-manager';
import { defaultUserSettings, type UserSettings } from '@/services/user-settings-service';

export type UserStatus = 'Active' | 'Away' | 'In Meeting' | 'Out of Office' | 'DND' | 'Offline';

export type User = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  password?: string; 
  lastLogin?: string;
  status: UserStatus;
  enabledModules?: string[];
  dashboardLayout?: string[];
  pageSettings?: PageSettings;
  userSettings?: UserSettings;
  isTwoFactorEnabled?: boolean;
  twoFactorSecret?: string;
};

type LoginCredentials = Pick<User, 'username' | 'password'> & { twoFactorCode?: string };
type RegisterCredentials = Required<Pick<User, 'username' | 'password' | 'role' | 'displayName'>>;
type PasswordChangeCredentials = {
    currentPassword: any;
    newPassword: any;
};

type AuthContextType = {
  user: User | null;
  users: User[];
  login: (credentials: LoginCredentials) => Promise<{ twoFactorRequired: boolean }>;
  logout: () => void;
  register: (credentials: RegisterCredentials) => Promise<void>;
  updateUser: (username: string, data: Partial<User>) => void;
  deleteUser: (username: string) => void;
  changePassword: (credentials: PasswordChangeCredentials) => Promise<void>;
  isLoading: boolean;
  exportAllData: () => Record<string, any>;
  importAllData: (data: Record<string, any>) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const seedUsers: User[] = [
    { username: 'admin', displayName: 'Admin', password: 'password123', role: ROLES.ADMIN, lastLogin: new Date().toISOString(), avatarUrl: null, status: 'Active', enabledModules: getAllModuleNamesForRole(ROLES.ADMIN), dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, pageSettings: defaultPageSettings, userSettings: defaultUserSettings, isTwoFactorEnabled: false },
    { username: 'analyst', displayName: 'Analyst', password: 'password123', role: ROLES.ANALYST, avatarUrl: null, status: 'Active', enabledModules: getAllModuleNamesForRole(ROLES.ANALYST), dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, pageSettings: defaultPageSettings, userSettings: defaultUserSettings, isTwoFactorEnabled: false },
    { username: 'operator', displayName: 'Operator', password: 'password123', role: ROLES.OPERATOR, avatarUrl: null, status: 'Active', enabledModules: getAllModuleNamesForRole(ROLES.OPERATOR), dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, pageSettings: defaultPageSettings, userSettings: defaultUserSettings, isTwoFactorEnabled: false },
    { username: 'auditor', displayName: 'Auditor', password: 'password123', role: ROLES.AUDITOR, avatarUrl: null, status: 'Active', enabledModules: getAllModuleNamesForRole(ROLES.AUDITOR), dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, pageSettings: defaultPageSettings, userSettings: defaultUserSettings, isTwoFactorEnabled: false },
];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const syncUsers = useCallback((updatedUsers: User[]) => {
      setUsers(updatedUsers);
      localStorage.setItem('netra-users', JSON.stringify(updatedUsers));
  }, []);

  const mergeDeep = (target: any, source: any) => {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], mergeDeep(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
  };
  
  const migrateUserObject = (u: any) => {
      let needsUpdate = false;
      if (!u.status) { u.status = 'Active'; needsUpdate = true; }
      if (!u.enabledModules) { u.enabledModules = getAllModuleNamesForRole(u.role); needsUpdate = true; }
      if (!u.dashboardLayout) { u.dashboardLayout = DEFAULT_DASHBOARD_LAYOUT; needsUpdate = true; }
      if (!u.pageSettings) { u.pageSettings = defaultPageSettings; needsUpdate = true; }
      if (u.sidebarSettings) { delete u.sidebarSettings; needsUpdate = true; }
      if (!u.userSettings) { u.userSettings = defaultUserSettings; needsUpdate = true; }
      if (u.isTwoFactorEnabled === undefined) { u.isTwoFactorEnabled = false; needsUpdate = true; }
      // Deep merge to add new sub-properties like 'security' to userSettings
      u.userSettings = mergeDeep(JSON.parse(JSON.stringify(defaultUserSettings)), u.userSettings);

      return { user: u as User, needsUpdate };
  }

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient) return;

    try {
      const storedUsersJSON = localStorage.getItem('netra-users');
      let allUsers: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : seedUsers;
      let anyUserUpdated = false;

      const migratedUsers = allUsers.map((u: any) => {
          const { user: migratedUser, needsUpdate } = migrateUserObject(u);
          if (needsUpdate) anyUserUpdated = true;
          return migratedUser;
      });
      
      setUsers(migratedUsers);
      if (!storedUsersJSON || anyUserUpdated) {
          syncUsers(migratedUsers);
      }

      const storedCurrentUserJSON = localStorage.getItem('netra-currentUser');
      if (storedCurrentUserJSON) {
        let currentUser: any = JSON.parse(storedCurrentUserJSON);
        const { user: migratedUser, needsUpdate } = migrateUserObject(currentUser);
        if (needsUpdate) {
            localStorage.setItem('netra-currentUser', JSON.stringify(migratedUser));
        }
        setUser(migratedUser);
      }
    } catch (error) {
      console.error('Failed to parse data from localStorage', error);
      localStorage.clear();
      setUsers(seedUsers);
    } finally {
      setIsLoading(false);
    }
  }, [isClient, syncUsers]);

  const login = async (credentials: LoginCredentials) => {
    const foundUser = users.find(u => u.username === credentials.username);
    if (!foundUser || foundUser.password !== credentials.password) {
      throw new Error('Invalid username or password.');
    }

    if (foundUser.isTwoFactorEnabled) {
        if (!credentials.twoFactorCode) {
            return { twoFactorRequired: true };
        }
        // In a real app, this would be a server-side check.
        const { verify2faToken } = await import('@/actions/2fa-actions');
        const isValid = await verify2faToken({ secret: foundUser.twoFactorSecret!, token: credentials.twoFactorCode });
        if (!isValid) {
            throw new Error('Invalid Two-Factor code.');
        }
    }
    
    const loggedInUser = { ...foundUser, lastLogin: new Date().toISOString(), status: 'Active' as UserStatus };
    const updatedUsers = users.map(u => u.username === loggedInUser.username ? loggedInUser : u);
    syncUsers(updatedUsers);
    setUser(loggedInUser);
    localStorage.setItem('netra-currentUser', JSON.stringify(loggedInUser));
    toast({ title: `Login Successful`, description: `Welcome back, ${loggedInUser.displayName}.` });
    router.push('/dashboard');
    return { twoFactorRequired: false };
  };

  const register = async (credentials: RegisterCredentials) => {
    if (users.some(u => u.username === credentials.username)) {
      throw new Error('Username already exists.');
    }
    const newUser: User = { 
        ...credentials, 
        lastLogin: new Date().toISOString(),
        avatarUrl: null,
        status: 'Active',
        enabledModules: getAllModuleNamesForRole(credentials.role),
        dashboardLayout: DEFAULT_DASHBOARD_LAYOUT,
        pageSettings: defaultPageSettings,
        userSettings: defaultUserSettings,
        isTwoFactorEnabled: false,
    };
    const updatedUsers = [...users, newUser];
    
    syncUsers(updatedUsers);
    setUser(newUser);
    localStorage.setItem('netra-currentUser', JSON.stringify(newUser));

    toast({ title: `Successfully registered!`, description: `Welcome to NETRA-X, ${credentials.displayName}.` });
    router.push('/dashboard');
  };

  const logout = () => {
    if (user) {
        updateUser(user.username, { status: 'Offline' });
    }
    localStorage.removeItem('netra-currentUser');
    setUser(null);
    router.push('/login');
  };

  const updateUser = (username: string, data: Partial<User>) => {
    const updatedUsers = users.map(u => u.username === username ? { ...u, ...data } : u);
    syncUsers(updatedUsers);
    if(user && user.username === username) {
        const updatedCurrentUser = {...user, ...data};
        setUser(updatedCurrentUser);
        localStorage.setItem('netra-currentUser', JSON.stringify(updatedCurrentUser));
    }
  };
  
  const changePassword = async (credentials: PasswordChangeCredentials) => {
      if (!user) {
          throw new Error("No user is currently logged in.");
      }
      
      const foundUser = users.find(u => u.username === user.username);
      if (!foundUser || foundUser.password !== credentials.currentPassword) {
          throw new Error("Your current password is not correct.");
      }

      updateUser(user.username, { password: credentials.newPassword });
  };

  const deleteUser = (username: string) => {
    if(user && user.username === username) {
        logout();
    }
    const updatedUsers = users.filter(u => u.username !== username);
    syncUsers(updatedUsers);
  };
  
  const exportAllData = () => {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('netra-')) {
              data[key] = JSON.parse(localStorage.getItem(key)!);
          }
      }
      return data;
  };
  
  const importAllData = (data: Record<string, any>) => {
      Object.keys(data).forEach(key => {
          if (key.startsWith('netra-')) {
              localStorage.setItem(key, JSON.stringify(data[key]));
          }
      });
  };

  const value = { user, users, login, logout, register, updateUser, deleteUser, changePassword, isLoading, exportAllData, importAllData };

  if (!isClient) {
      return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
