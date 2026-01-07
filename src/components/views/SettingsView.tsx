import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security';

export const SettingsView = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    updateUser(profileData);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="glass-panel p-1 inline-flex gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Profile Settings</h2>
              <p className="text-muted-foreground">Manage your personal information</p>
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-3xl font-bold">
                {user?.name.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.name}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="pt-6 border-t border-border/50">
            <h3 className="text-sm font-medium mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="font-medium">{user?.createdAt ? format(user.createdAt, 'MMM d, yyyy') : 'N/A'}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Last Login</p>
                <p className="font-medium">{user?.lastLogin ? format(user.lastLogin, 'MMM d, yyyy HH:mm') : 'N/A'}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Account Status</p>
                <p className="font-medium text-success capitalize">{user?.status}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveProfile} disabled={isSaving} className="gradient-primary">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Notification Preferences</h2>
            <p className="text-muted-foreground">Configure how you receive alerts and updates</p>
          </div>

          <div className="space-y-4">
            {Object.entries({
              emailAlerts: { label: 'Email Alerts', description: 'Receive critical alerts via email' },
              pushNotifications: { label: 'Push Notifications', description: 'Browser notifications for real-time updates' },
              criticalAlerts: { label: 'Critical Alerts', description: 'Always notify for critical vehicle issues' },
              weeklyReports: { label: 'Weekly Reports', description: 'Receive weekly fleet summary reports' },
              maintenanceReminders: { label: 'Maintenance Reminders', description: 'Get notified about upcoming maintenance' },
            }).map(([key, { label, description }]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative',
                    notifications[key as keyof typeof notifications] ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    notifications[key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Appearance Settings</h2>
            <p className="text-muted-foreground">Customize the look and feel of your dashboard</p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Theme</h3>
              <div className="grid grid-cols-3 gap-4">
                {['dark', 'light', 'system'].map(theme => (
                  <button
                    key={theme}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-center capitalize',
                      theme === 'dark' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border/50 hover:border-primary/50'
                    )}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2" />
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Language</h3>
              <div className="relative max-w-xs">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <select className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Security Settings</h2>
            <p className="text-muted-foreground">Manage your account security and access</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
                <Button variant="outline">Change</Button>
              </div>
            </div>

            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </div>

            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">Manage your logged-in devices</p>
                </div>
                <Button variant="outline">View</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
