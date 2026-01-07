import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBodyOverflow } from '@/hooks/useBodyOverflow';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Building2, 
  Phone, 
  Shield, 
  Bell, 
  Moon, 
  Globe,
  Lock,
  Save,
  Camera,
  CheckCircle,
  X,
  Sun,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Prevent body scroll when modal is open
  useBodyOverflow(isOpen);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('fleetai_theme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
    }
  }, []);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || '',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    criticalAlerts: true,
    weeklyReports: false,
    maintenanceReminders: true,
  });

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const [selectedTheme, setSelectedTheme] = useState('dark');

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    
    // Save to localStorage
    localStorage.setItem('fleetai_theme', theme);
    
    // Apply theme immediately
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }
    
    // Show feedback
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    updateUser(profileData);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async () => {
    // Mock password change
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    loginAlerts: true,
  });

  const handleToggle2FA = () => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorEnabled: !prev.twoFactorEnabled
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  const roleColors = {
    admin: 'bg-destructive/20 text-destructive border-destructive/30',
    manager: 'bg-primary/20 text-primary border-primary/30',
    operator: 'bg-success/20 text-success border-success/30',
    viewer: 'bg-muted text-muted-foreground border-border',
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Full coverage */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[9998] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal - Side Drawer Style - Full height */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-card border-l border-border/50 shadow-2xl z-[9999] flex flex-col overflow-hidden" style={{
        animation: 'slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      }}>
        {/* Header - Sticky */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-secondary/50 to-secondary/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">Account Settings</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-border/50 bg-secondary/20 p-3 space-y-1 overflow-y-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all text-left whitespace-nowrap',
                    activeTab === tab.id 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Profile Settings</h3>
                    <p className="text-muted-foreground text-sm">Manage your personal information</p>
                  </div>
                  {saved && (
                    <span className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Saved successfully
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-6 pb-6 border-b border-border/50">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold">
                      {user?.name.charAt(0)}
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{user?.name}</h4>
                    <p className="text-muted-foreground text-sm">{user?.email}</p>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 mt-2 rounded-full text-xs font-medium border capitalize',
                      roleColors[user?.role || 'viewer']
                    )}>
                      {user?.role === 'admin' && <Shield className="w-3 h-3" />}
                      {user?.role}
                    </span>
                  </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={profileData.email}
                        className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 opacity-60"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={profileData.department}
                        onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                        className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Enter department"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-medium mb-3">Account Information</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="font-medium text-sm">{user?.createdAt ? format(user.createdAt, 'MMM d, yyyy') : 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Last Login</p>
                      <p className="font-medium text-sm">{user?.lastLogin ? format(user.lastLogin, 'MMM d, HH:mm') : 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium text-sm text-success capitalize">{user?.status}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="gradient-primary">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-bold mb-1">Notification Preferences</h3>
                  <p className="text-muted-foreground text-sm">Configure how you receive alerts and updates</p>
                </div>

                <div className="space-y-3">
                  {Object.entries({
                    emailAlerts: { label: 'Email Alerts', description: 'Receive critical alerts via email' },
                    pushNotifications: { label: 'Push Notifications', description: 'Browser notifications for real-time updates' },
                    criticalAlerts: { label: 'Critical Alerts', description: 'Always notify for critical vehicle issues' },
                    weeklyReports: { label: 'Weekly Reports', description: 'Receive weekly fleet summary reports' },
                    maintenanceReminders: { label: 'Maintenance Reminders', description: 'Get notified about upcoming maintenance' },
                  }).map(([key, { label, description }]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative',
                          notifications[key as keyof typeof notifications] ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <span className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                          notifications[key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-bold mb-1">Appearance Settings</h3>
                  <p className="text-muted-foreground text-sm">Customize the look and feel of your dashboard</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Theme</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'dark', icon: Moon, label: 'Dark' },
                        { id: 'light', icon: Sun, label: 'Light' },
                        { id: 'system', icon: Monitor, label: 'System' },
                      ].map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeChange(theme.id)}
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all text-center',
                            selectedTheme === theme.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border/50 hover:border-primary/50'
                          )}
                        >
                          <theme.icon className="w-5 h-5 mx-auto mb-2" />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Language</h4>
                    <div className="relative max-w-xs">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Accent Color</h4>
                    <div className="flex gap-3">
                      {['#22d3ee', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            document.documentElement.style.setProperty('--primary', color.replace('#', ''));
                            setSaved(true);
                            setTimeout(() => setSaved(false), 1500);
                          }}
                          className={cn(
                            'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                            'hover:border-white/50'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {saved && <p className="text-xs text-success mt-2">✓ Color applied!</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-bold mb-1">Security Settings</h3>
                  <p className="text-muted-foreground text-sm">Manage your account security and access</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Change Password</p>
                        <p className="text-xs text-muted-foreground">Update your account password</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handlePasswordChange} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Change'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <button
                        onClick={handleToggle2FA}
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative',
                          securitySettings.twoFactorEnabled ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <span className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                          securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Active Sessions</p>
                        <p className="text-xs text-muted-foreground">Manage your logged-in devices</p>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-lg border border-destructive/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-destructive">Delete Account</p>
                        <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
                      </div>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
