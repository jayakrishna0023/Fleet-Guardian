import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { User, AuthState, LoginCredentials, RegisterData, UserRole, UserStatus } from '@/types/auth';
import { firebaseAuthService, UserProfile } from '@/services/firebaseAuth';
import { isFirebaseConfigured } from '@/config/firebase';
import { sessionManager } from '@/services/sessionManager';
import { sendWelcomeEmail } from '@/services/emailService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  getAllUsers: () => User[];
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  isFirebaseMode: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const MOCK_USERS: User[] = [
  {
    id: 'admin-001',
    email: 'admin@fleetai.com',
    name: 'System Administrator',
    role: 'admin',
    status: 'approved',
    department: 'IT Operations',
    phone: '+1 (555) 000-0001',
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: 'manager-001',
    email: 'manager@fleetai.com',
    name: 'Fleet Manager',
    role: 'manager',
    status: 'approved',
    department: 'Fleet Operations',
    phone: '+1 (555) 000-0002',
    createdAt: new Date('2024-02-15'),
    approvedBy: 'admin-001',
    approvedAt: new Date('2024-02-16'),
    lastLogin: new Date(Date.now() - 86400000),
  },
  {
    id: 'operator-001',
    email: 'operator@fleetai.com',
    name: 'John Operator',
    role: 'operator',
    status: 'approved',
    department: 'Field Operations',
    createdAt: new Date('2024-03-10'),
    approvedBy: 'admin-001',
    approvedAt: new Date('2024-03-11'),
  },
  {
    id: 'pending-001',
    email: 'newuser@company.com',
    name: 'Pending User',
    role: 'viewer',
    status: 'pending',
    department: 'Logistics',
    createdAt: new Date(Date.now() - 172800000),
  },
];

const MOCK_PASSWORDS: Record<string, string> = {
  'admin@fleetai.com': 'admin123',
  'manager@fleetai.com': 'manager123',
  'operator@fleetai.com': 'operator123',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // Determine Firebase mode synchronously
  const isFirebaseMode = isFirebaseConfigured();

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Log mode on mount
  useEffect(() => {
    console.log(`Auth mode: ${isFirebaseMode ? 'Firebase Auth' : 'Local Mock Auth'}`);
  }, [isFirebaseMode]);

  // Load users from Firebase (for admin)
  useEffect(() => {
    if (isFirebaseMode && authState.user?.role === 'admin') {
      const loadUsers = async () => {
        const allUsers = await firebaseAuthService.getAllUsers();
        const mappedUsers: User[] = allUsers.map(u => ({
          id: u.uid,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          phone: u.phone,
          avatar: u.avatar,
          department: u.department,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
          loginCount: u.loginCount,
          approvedBy: u.approvedBy,
          approvedAt: u.approvedAt,
        }));
        setUsers(mappedUsers);
      };
      loadUsers();
    }
  }, [isFirebaseMode, authState.user?.role]);

  // Check for stored session on mount (for both modes)
  useEffect(() => {
    if (isFirebaseMode) {
      // Subscribe to Firebase auth state changes
      const unsubscribe = firebaseAuthService.onAuthStateChange((profile) => {
        if (profile) {
          // Only set authenticated if user is approved
          if (profile.status === 'approved') {
            const user: User = {
              id: profile.uid,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              status: profile.status,
              phone: profile.phone,
              avatar: profile.avatar,
              department: profile.department,
              createdAt: profile.createdAt,
              lastLogin: profile.lastLogin,
              loginCount: profile.loginCount,
            };
            // Create secure session
            sessionManager.createSession({
              userId: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              status: user.status,
            });
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // User exists but not approved - don't authenticate
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      });
      return () => unsubscribe();
    } else {
      // Local mock auth - no auto-login, require manual login
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isFirebaseMode]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    if (isFirebaseMode) {
      try {
        const profile = await firebaseAuthService.login(credentials.email, credentials.password);
        const user: User = {
          id: profile.uid,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          status: profile.status as User['status'],
          phone: profile.phone,
          avatar: profile.avatar,
          department: profile.department,
          createdAt: profile.createdAt,
          lastLogin: profile.lastLogin,
        };
        // Create secure session
        sessionManager.createSession({
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        });
        // Store user info for email notifications
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_name', user.name);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, message: 'Login successful!' };
      } catch (error: any) {
        console.error('Firebase login error:', error);
        return { success: false, message: error.message || 'Login failed. Please check your credentials.' };
      }
    }

    // Local mock auth - no localStorage session persistence
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = users.find(u => u.email === credentials.email);

    if (!user) {
      return { success: false, message: 'User not found. Please check your email.' };
    }

    if (MOCK_PASSWORDS[credentials.email] !== credentials.password) {
      return { success: false, message: 'Invalid password. Please try again.' };
    }

    if (user.status === 'pending') {
      return { success: false, message: 'Your account is pending approval. Please wait for admin confirmation.' };
    }

    if (user.status === 'rejected') {
      return { success: false, message: 'Your account request was rejected. Please contact support.' };
    }

    if (user.status === 'suspended') {
      return { success: false, message: 'Your account has been suspended. Please contact admin.' };
    }

    const updatedUser = { ...user, lastLogin: new Date() };
    // Don't store in localStorage - require manual login each time
    // But store user info for email notifications
    localStorage.setItem('user_email', user.email);
    localStorage.setItem('user_name', user.name);

    setAuthState({
      user: updatedUser,
      isAuthenticated: true,
      isLoading: false,
    });

    return { success: true, message: 'Login successful!' };
  }, [isFirebaseMode, users]);

  const register = useCallback(async (data: RegisterData) => {
    if (isFirebaseMode) {
      try {
        await firebaseAuthService.register(data.email, data.password, data.name, 'viewer');

        // Send welcome email
        try {
          await sendWelcomeEmail({
            userName: data.name,
            userEmail: data.email,
            registrationDate: new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }),
            role: 'Fleet Manager',
          });
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.log('Welcome email not sent (EmailJS not configured):', emailError);
        }

        return {
          success: true,
          message: 'Registration successful! Welcome email has been sent. You can now log in.'
        };
      } catch (error: any) {
        console.error('Firebase register error:', error);
        return { success: false, message: error.message || 'Registration failed.' };
      }
    }

    // Local mock auth
    await new Promise(resolve => setTimeout(resolve, 800));

    const existingUser = users.find(u => u.email === data.email);
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: 'viewer',
      status: 'pending',
      department: data.department,
      phone: data.phone,
      createdAt: new Date(),
    };

    // Send welcome email for local auth too
    try {
      await sendWelcomeEmail({
        userName: data.name,
        userEmail: data.email,
        registrationDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
        role: 'Fleet Manager',
      });
    } catch (emailError) {
      console.log('Welcome email not sent:', emailError);
    }

    setUsers(prev => [...prev, newUser]);
    MOCK_PASSWORDS[data.email] = data.password;

    return {
      success: true,
      message: 'Registration successful! Your account is pending admin approval.'
    };
  }, [users]);

  const logout = useCallback(async () => {
    if (isFirebaseMode) {
      await firebaseAuthService.logout();
    }
    // Clear session properly
    sessionManager.clearSession();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, [isFirebaseMode]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (isFirebaseMode && authState.user) {
      await firebaseAuthService.updateUserProfile(updates);
    }
    if (authState.user) {
      const updatedUser = { ...authState.user, ...updates };
      // Update session if it's the current user
      if (isFirebaseMode && updatedUser.id === authState.user?.id) {
        sessionManager.updateSession({
          userId: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          status: updatedUser.status,
        });
      }
      setAuthState(prev => ({ ...prev, user: updatedUser }));
    }
  }, [isFirebaseMode, authState.user]);

  const getAllUsers = useCallback(() => {
    return users;
  }, [users]);

  const approveUser = useCallback(async (userId: string) => {
    console.log('ApproveUser called with userId:', userId);
    console.log('Current users:', users);
    console.log('IsFirebaseMode:', isFirebaseMode);

    if (isFirebaseMode) {
      try {
        await firebaseAuthService.approveUser(userId, authState.user?.id || '');
        // Refresh users list
        const allUsers = await firebaseAuthService.getAllUsers();
        const mappedUsers: User[] = allUsers.map(u => ({
          id: u.uid,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          phone: u.phone,
          avatar: u.avatar,
          department: u.department,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
          loginCount: u.loginCount,
          approvedBy: u.approvedBy,
          approvedAt: u.approvedAt,
        }));
        setUsers(mappedUsers);
        console.log('User approved via Firebase:', userId);
      } catch (error) {
        console.error('Error approving user:', error);
      }
    } else {
      console.log('Approving user in local mode:', userId);
      setUsers(prev => {
        const updated = prev.map(u =>
          u.id === userId
            ? {
              ...u,
              status: 'approved' as UserStatus,
              approvedBy: authState.user?.id,
              approvedAt: new Date()
            }
            : u
        );
        console.log('Updated users after approval:', updated);
        return updated;
      });
    }
  }, [isFirebaseMode, authState.user?.id, users]);

  const rejectUser = useCallback(async (userId: string) => {
    console.log('RejectUser called with userId:', userId);
    console.log('Current users:', users);
    console.log('IsFirebaseMode:', isFirebaseMode);

    if (isFirebaseMode) {
      try {
        await firebaseAuthService.rejectUser(userId);
        // Refresh users list
        const allUsers = await firebaseAuthService.getAllUsers();
        const mappedUsers: User[] = allUsers.map(u => ({
          id: u.uid,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          phone: u.phone,
          avatar: u.avatar,
          department: u.department,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
          loginCount: u.loginCount,
        }));
        setUsers(mappedUsers);
        console.log('User rejected via Firebase:', userId);
      } catch (error) {
        console.error('Error rejecting user:', error);
      }
    } else {
      console.log('Rejecting user in local mode:', userId);
      setUsers(prev => {
        const updated = prev.map(u =>
          u.id === userId ? { ...u, status: 'rejected' as UserStatus } : u
        );
        console.log('Updated users after rejection:', updated);
        return updated;
      });
    }
  }, [isFirebaseMode, users]);

  const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
    if (isFirebaseMode) {
      try {
        await firebaseAuthService.updateUserRole(userId, role);
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, role } : u
        ));
      } catch (error) {
        console.error('Error updating user role:', error);
      }
    } else {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role } : u
      ));
    }
  }, [isFirebaseMode]);

  // Computed properties for role checks
  const isAdmin = useMemo(() => authState.user?.role === 'admin', [authState.user?.role]);
  const isManager = useMemo(() => authState.user?.role === 'manager' || authState.user?.role === 'admin', [authState.user?.role]);

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
      updateUser,
      getAllUsers,
      approveUser,
      rejectUser,
      updateUserRole,
      isFirebaseMode,
      isAdmin,
      isManager,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
