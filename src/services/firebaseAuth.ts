// Firebase Authentication Service
// Provides all auth functions: login, register, logout, password reset, etc.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  phone?: string;
  avatar?: string;
  department?: string;
  address?: string;
  createdAt: Date;
  lastLogin: Date;
  loginCount?: number;
  approvedBy?: string;
  approvedAt?: Date;
  settings?: {
    notifications: boolean;
    twoFactorEnabled: boolean;
    theme: 'dark' | 'light' | 'system';
  };
}

class FirebaseAuthService {
  private currentUser: FirebaseUser | null = null;
  private userProfile: UserProfile | null = null;
  private listeners: ((user: UserProfile | null) => void)[] = [];

  constructor() {
    if (isFirebaseConfigured()) {
      this.initAuthListener();
    }
  }

  private initAuthListener() {
    if (!auth) return;
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        this.userProfile = await this.fetchUserProfile(user.uid);
        // Update last login
        if (this.userProfile) {
          await this.updateLastLogin(user.uid);
        }
      } else {
        this.userProfile = null;
      }
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.userProfile));
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.userProfile);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Fetch user profile from Firestore
  private async fetchUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          email: data.email,
          name: data.name,
          role: data.role || 'viewer',
          status: data.status || 'pending',
          phone: data.phone,
          avatar: data.avatar,
          department: data.department,
          address: data.address,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
          loginCount: data.loginCount || 0,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt?.toDate(),
          settings: data.settings,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update last login timestamp and increment login count
  private async updateLastLogin(uid: string) {
    if (!db) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const currentCount = userDoc.exists() ? (userDoc.data().loginCount || 0) : 0;
      await updateDoc(doc(db, 'users', uid), {
        lastLogin: serverTimestamp(),
        loginCount: currentCount + 1,
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Create default profile for existing Auth user missing in Firestore
  private async createDefaultProfile(user: FirebaseUser): Promise<UserProfile> {
    if (!db) throw new Error('Firebase not configured');
    const email = user.email || '';
    const name = user.displayName || email.split('@')[0];
    const isAdmin = email === 'admin@fleetai.com';

    const userProfileData = {
      email,
      name,
      role: isAdmin ? 'admin' : 'viewer',
      status: isAdmin ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      loginCount: 1,
      settings: {
        notifications: true,
        twoFactorEnabled: false,
        theme: 'dark' as const,
      },
    };

    await setDoc(doc(db, 'users', user.uid), userProfileData);

    return {
      uid: user.uid,
      email,
      name,
      role: isAdmin ? 'admin' : 'viewer',
      status: isAdmin ? 'approved' : 'pending',
      createdAt: new Date(),
      lastLogin: new Date(),
      loginCount: 1,
      settings: {
        notifications: true,
        twoFactorEnabled: false,
        theme: 'dark',
      },
    } as UserProfile;
  }

  // Register new user
  async register(email: string, password: string, name: string, role: UserProfile['role'] = 'viewer'): Promise<UserProfile> {
    if (!auth || !db) throw new Error('Firebase not configured');
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    const isAdmin = email === 'admin@fleetai.com';

    // Create user profile in Firestore with pending status
    const userProfileData = {
      email,
      name,
      role: isAdmin ? 'admin' : role,
      status: isAdmin ? 'approved' : 'pending', // New users need admin approval
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      loginCount: 1,
      settings: {
        notifications: true,
        twoFactorEnabled: false,
        theme: 'dark' as const,
      },
    };

    await setDoc(doc(db, 'users', user.uid), userProfileData);

    const profile: UserProfile = {
      uid: user.uid,
      email,
      name,
      role,
      status: 'pending',
      createdAt: new Date(),
      lastLogin: new Date(),
      loginCount: 1,
      settings: {
        notifications: true,
        twoFactorEnabled: false,
        theme: 'dark',
      },
    };

    this.userProfile = profile;
    this.notifyListeners();
    return profile;
  }

  // Login user
  async login(email: string, password: string): Promise<UserProfile> {
    if (!auth) throw new Error('Firebase not configured');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    let profile = await this.fetchUserProfile(userCredential.user.uid);
    if (!profile) {
      console.warn('User profile not found in Firestore, creating default profile...');
      try {
        profile = await this.createDefaultProfile(userCredential.user);
      } catch (err) {
        console.error('Failed to create default profile:', err);
        await signOut(auth);
        throw new Error('User profile not found and could not be created.');
      }
    }

    // Auto-approve admin email if needed (fix for bootstrap issues)
    if (profile.email === 'admin@fleetai.com') {
      if (profile.role !== 'admin' || profile.status !== 'approved') {
        console.log('Auto-approving admin user...');
        await updateDoc(doc(db, 'users', profile.uid), {
          role: 'admin',
          status: 'approved',
          approvedBy: 'system',
          approvedAt: serverTimestamp()
        });
        profile.role = 'admin';
        profile.status = 'approved';
      }
    }

    // Check user status - block if not approved
    if (profile.status === 'pending') {
      await signOut(auth);
      throw new Error('Your account is pending admin approval. Please wait for confirmation.');
    }
    if (profile.status === 'rejected') {
      await signOut(auth);
      throw new Error('Your account request was rejected. Please contact support.');
    }
    if (profile.status === 'suspended') {
      await signOut(auth);
      throw new Error('Your account has been suspended. Please contact admin.');
    }

    this.userProfile = profile;
    this.notifyListeners();
    return profile;
  }

  // Logout user
  async logout(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
    this.currentUser = null;
    this.userProfile = null;
    this.notifyListeners();
  }

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    if (!auth) throw new Error('Firebase not configured');
    await sendPasswordResetEmail(auth, email);
  }

  // Update user profile
  async updateUserProfile(updates: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt'>>): Promise<void> {
    if (!this.currentUser || !db) throw new Error('No user logged in or Firebase not configured');

    // Update Firestore
    await updateDoc(doc(db, 'users', this.currentUser.uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Update display name if changed
    if (updates.name && updates.name !== this.currentUser.displayName) {
      await updateProfile(this.currentUser, { displayName: updates.name });
    }

    // Refresh profile
    this.userProfile = await this.fetchUserProfile(this.currentUser.uid);
    this.notifyListeners();
  }

  // Update email (requires recent login)
  async updateUserEmail(newEmail: string, currentPassword: string): Promise<void> {
    if (!this.currentUser || !this.currentUser.email || !db) throw new Error('No user logged in or Firebase not configured');

    // Re-authenticate
    const credential = EmailAuthProvider.credential(this.currentUser.email, currentPassword);
    await reauthenticateWithCredential(this.currentUser, credential);

    // Update email
    await updateEmail(this.currentUser, newEmail);

    // Update Firestore
    await updateDoc(doc(db, 'users', this.currentUser.uid), { email: newEmail });

    // Refresh profile
    this.userProfile = await this.fetchUserProfile(this.currentUser.uid);
    this.notifyListeners();
  }

  // Update password (requires recent login)
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser || !this.currentUser.email) throw new Error('No user logged in');

    // Re-authenticate
    const credential = EmailAuthProvider.credential(this.currentUser.email, currentPassword);
    await reauthenticateWithCredential(this.currentUser, credential);

    // Update password
    await updatePassword(this.currentUser, newPassword);
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    return this.userProfile;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Check if user has specific role
  hasRole(roles: UserProfile['role'][]): boolean {
    if (!this.userProfile) return false;
    return roles.includes(this.userProfile.role);
  }

  // Check if admin
  isAdmin(): boolean {
    return this.userProfile?.role === 'admin';
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<UserProfile[]> {
    if (!db) return [];
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      return usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          name: data.name,
          role: data.role || 'viewer',
          status: data.status || 'pending',
          phone: data.phone,
          avatar: data.avatar,
          department: data.department,
          address: data.address,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
          loginCount: data.loginCount || 0,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt?.toDate(),
          settings: data.settings,
        };
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // Approve user (admin only)
  async approveUser(userId: string, adminId: string): Promise<void> {
    if (!db) throw new Error('Firebase not configured');
    await updateDoc(doc(db, 'users', userId), {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
    });
  }

  // Reject user (admin only)
  async rejectUser(userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not configured');
    await updateDoc(doc(db, 'users', userId), {
      status: 'rejected',
    });
  }

  // Update user role (admin only)
  async updateUserRole(userId: string, role: UserProfile['role']): Promise<void> {
    if (!db) throw new Error('Firebase not configured');
    await updateDoc(doc(db, 'users', userId), { role });
  }

  // Suspend user (admin only)
  async suspendUser(userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not configured');
    await updateDoc(doc(db, 'users', userId), {
      status: 'suspended',
    });
  }
}

export const firebaseAuthService = new FirebaseAuthService();
