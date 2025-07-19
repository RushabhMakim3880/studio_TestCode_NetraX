
'use client';

import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES, type Role, getAllModuleNamesForRole } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_DASHBOARD_LAYOUT } from '@/lib/dashboard-cards';
import { defaultPageSettings, type PageSettings } from '@/components/settings/page-settings-manager';


export type User = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  password?: string; // Should be hashed in a real app
  lastLogin?: string;
  enabledModules?: string[];
  dashboardLayout?: string[];
  pageSettings?: PageSettings;
};

type LoginCredentials = Pick<User, 'username' | 'password'>;
type RegisterCredentials = Required<Pick<User, 'username' | 'password' | 'role' | 'displayName'>>;
type PasswordChangeCredentials = {
    currentPassword: any;
    newPassword: any;
};

type AuthContextType = {
  user: User | null;
  users: User[];
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (credentials: RegisterCredentials) => Promise<void>;
  updateUser: (username: string, data: Partial<User>) => void;
  deleteUser: (username: string) => void;
  changePassword: (credentials: PasswordChangeCredentials) => Promise<void>;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const seedUsers: User[] = [
    { username: 'admin', displayName: 'Admin', password: 'password123', role: ROLES.ADMIN, lastLogin: new Date().toISOString(), avatarUrl: null, enabledModules: getAllModuleNamesForRole(ROLES.ADMIN), dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, pageSettings: defaultPageSettings },
    { username: 'analyst', displayName: 'Analyst', password: 'password123', role: ROLES.ANALYST, avatarUrl: null, enabledModules: getAllModuleNamesForRole(ROLES.ANALYST), dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, pageSettings: defaultPageSettings },
    { username: 'operator', displayName: 'Operator', password: 'password123', role: ROLES.OPERATOR, avatarUrl: null, enabledModules: getAllModuleNamesForRole(ROLES.OPERATOR), dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, pageSettings: defaultPageSettings },
    { username: 'auditor', displayName: 'Auditor', password: 'password123', role: ROLES.AUDITOR, avatarUrl: null, enabledModules: getAllModuleNamesForRole(ROLES.AUDITOR), dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, pageSettings: defaultPageSettings },
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

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient) return;

    try {
      const storedUsersJSON = localStorage.getItem('netra-users');
      let allUsers: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : seedUsers;

      // Data migration for users in localStorage that don't have new properties
      const migratedUsers = allUsers.map((u: any) => { // Use any to handle old structure
          let needsUpdate = false;
          if (!u.enabledModules) { u.enabledModules = getAllModuleNamesForRole(u.role); needsUpdate = true; }
          if (!u.dashboardLayout) { u.dashboardLayout = DEFAULT_DASHBOARD_LAYOUT; needsUpdate = true; }
          
          if (!u.pageSettings) {
            u.pageSettings = defaultPageSettings;
            // if old sidebarSettings exist, migrate them
            if (u.sidebarSettings) {
                u.pageSettings.sidebar = u.sidebarSettings;
            }
            needsUpdate = true;
          }
          // Remove the old sidebarSettings property
          if (u.sidebarSettings) {
            delete u.sidebarSettings;
            needsUpdate = true;
          }
          
          return u as User;
      });

      setUsers(migratedUsers);

      if (!storedUsersJSON || JSON.stringify(allUsers) !== JSON.stringify(migratedUsers)) {
          localStorage.setItem('netra-users', JSON.stringify(migratedUsers));
      }

      const storedCurrentUserJSON = localStorage.getItem('netra-currentUser');
      if (storedCurrentUserJSON) {
        let currentUser: any = JSON.parse(storedCurrentUserJSON);
        let currentUserNeedsUpdate = false;
        if (!currentUser.enabledModules) { currentUser.enabledModules = getAllModuleNamesForRole(currentUser.role); currentUserNeedsUpdate = true; }
        if (!currentUser.dashboardLayout) { currentUser.dashboardLayout = DEFAULT_DASHBOARD_LAYOUT; currentUserNeedsUpdate = true; }
        
        if (!currentUser.pageSettings) {
            currentUser.pageSettings = defaultPageSettings;
             if (currentUser.sidebarSettings) {
                currentUser.pageSettings.sidebar = currentUser.sidebarSettings;
            }
            currentUserNeedsUpdate = true;
        }
        if (currentUser.sidebarSettings) {
           delete currentUser.sidebarSettings;
           currentUserNeedsUpdate = true;
        }
        
        if(currentUserNeedsUpdate) {
            localStorage.setItem('netra-currentUser', JSON.stringify(currentUser));
        }
        setUser(currentUser);
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

    // In a real app, you'd compare hashed passwords
    if (foundUser && foundUser.password === credentials.password) {
      const loggedInUser = { ...foundUser, lastLogin: new Date().toISOString() };
      const updatedUsers = users.map(u => u.username === loggedInUser.username ? loggedInUser : u);
      
      syncUsers(updatedUsers);
      setUser(loggedInUser);
      localStorage.setItem('netra-currentUser', JSON.stringify(loggedInUser));

      toast({
        title: `Login Successful`,
        description: `Welcome back, ${loggedInUser.displayName}.`,
      });
      router.push('/dashboard');
    } else {
      throw new Error('Invalid username or password.');
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    if (users.some(u => u.username === credentials.username)) {
      throw new Error('Username already exists.');
    }
    const newUser: User = { 
        ...credentials, 
        lastLogin: new Date().toISOString(),
        avatarUrl: null,
        enabledModules: getAllModuleNamesForRole(credentials.role),
        dashboardLayout: DEFAULT_DASHBOARD_LAYOUT,
        pageSettings: defaultPageSettings,
    };
    const updatedUsers = [...users, newUser];
    
    syncUsers(updatedUsers);
    setUser(newUser);
    localStorage.setItem('netra-currentUser', JSON.stringify(newUser));

    toast({
        title: `Successfully registered!`,
        description: `Welcome to NETRA-X, ${credentials.displayName}.`,
    });
    router.push('/dashboard');
  };

  const logout = () => {
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
        // This case is handled in the UI, but as a safeguard
        logout();
    }
    const updatedUsers = users.filter(u => u.username !== username);
    syncUsers(updatedUsers);
  };

  const value = { user, users, login, logout, register, updateUser, deleteUser, changePassword, isLoading };

  if (!isClient) {
      return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
