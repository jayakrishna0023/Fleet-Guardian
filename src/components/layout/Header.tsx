import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Search,
  User,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Shield,
  Settings,
  X,
  Command,
  Sparkles,
  Car,
  AlertTriangle,
  Wrench,
  FileText,
  Mic
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { cn } from '@/lib/utils';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { SessionInfo } from '@/components/auth/SessionInfo';
import AudioOrb from '@/components/voice/AudioOrb';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title: string;
  subtitle?: string;
  alertCount: number;
}

interface SearchResult {
  type: 'vehicle' | 'alert' | 'report' | 'action';
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Car;
  onClick?: () => void;
}

export const Header = ({ title, subtitle, alertCount }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { vehicles, alerts } = useData();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get current theme
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'dark';
    }
    return 'dark';
  });

  const isDark = currentTheme === 'dark' || 
    (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Handle theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = isDark ? 'light' : 'dark';
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }, [isDark]);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search vehicles
    vehicles.forEach(vehicle => {
      if (
        vehicle.id.toLowerCase().includes(lowerQuery) ||
        vehicle.make?.toLowerCase().includes(lowerQuery) ||
        vehicle.model?.toLowerCase().includes(lowerQuery) ||
        vehicle.driver?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: 'vehicle',
          id: vehicle.id,
          title: `${vehicle.make} ${vehicle.model}`,
          subtitle: `${vehicle.id} • ${vehicle.driver || 'No driver'}`,
          icon: Car,
          onClick: () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'vehicle-detail', id: vehicle.id } }));
            setShowSearch(false);
          }
        });
      }
    });

    // Search alerts
    alerts.forEach(alert => {
      if (
        alert.message?.toLowerCase().includes(lowerQuery) ||
        alert.vehicleId?.toLowerCase().includes(lowerQuery) ||
        alert.type?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: 'alert',
          id: alert.id,
          title: alert.message || 'Alert',
          subtitle: `${alert.vehicleId} • ${alert.type}`,
          icon: AlertTriangle,
          onClick: () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'alerts' } }));
            setShowSearch(false);
          }
        });
      }
    });

    // Add quick actions
    const actions = [
      { keyword: 'vehicle', title: 'View All Vehicles', subtitle: 'Fleet overview', view: 'vehicles' },
      { keyword: 'alert', title: 'View All Alerts', subtitle: 'Recent notifications', view: 'alerts' },
      { keyword: 'report', title: 'Generate Report', subtitle: 'Analytics & insights', view: 'reports' },
      { keyword: 'maintenance', title: 'Maintenance Schedule', subtitle: 'Service reminders', view: 'predictions' },
      { keyword: 'upload', title: 'Upload Data', subtitle: 'Import vehicle data', view: 'upload' },
    ];

    actions.forEach(action => {
      if (action.keyword.includes(lowerQuery) || action.title.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'action',
          id: action.keyword,
          title: action.title,
          subtitle: action.subtitle,
          icon: action.keyword === 'report' ? FileText : action.keyword === 'maintenance' ? Wrench : Sparkles,
          onClick: () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: action.view } }));
            setShowSearch(false);
          }
        });
      }
    });

    setSearchResults(results.slice(0, 8));
    setIsSearching(false);
  }, [vehicles, alerts]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(searchQuery);
    }, 150);
    return () => clearTimeout(debounce);
  }, [searchQuery, performSearch]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleColors = {
    admin: 'bg-destructive/20 text-destructive border-destructive/30',
    manager: 'bg-primary/20 text-primary border-primary/30',
    operator: 'bg-success/20 text-success border-success/30',
    viewer: 'bg-muted text-muted-foreground border-border',
  };

  // Get recent alerts for notifications
  const recentAlerts = alerts.slice(0, 5);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="h-16 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 md:px-6 relative z-[100]"
    >
      {/* Animated background shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Left - Title & Breadcrumb */}
      <motion.div 
        className="flex items-center gap-4 relative z-10"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div>
          <motion.h1 
            className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p 
              className="text-xs md:text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Center - Search Bar (Desktop) */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-8" ref={searchRef}>
        <div className="relative w-full">
          <div
            onClick={() => {
              setShowSearch(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className={cn(
              'w-full h-10 flex items-center gap-3 px-4 bg-secondary/50 border border-border/50 rounded-xl cursor-text transition-all duration-300',
              showSearch && 'ring-2 ring-primary/50 border-primary/50 bg-background shadow-lg'
            )}
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            {showSearch ? (
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vehicles, alerts, reports..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm text-muted-foreground">Search anything...</span>
            )}
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showSearch && (
            <div className="absolute top-full mt-2 w-full bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              {isSearching ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  <Sparkles className="w-5 h-5 mx-auto mb-2 animate-pulse" />
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={result.onClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        result.type === 'vehicle' && 'bg-blue-500/10 text-blue-500',
                        result.type === 'alert' && 'bg-orange-500/10 text-orange-500',
                        result.type === 'action' && 'bg-purple-500/10 text-purple-500'
                      )}>
                        <result.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{result.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No results for "{searchQuery}"
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-3">Quick Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'View Fleet', icon: Car, view: 'vehicles' },
                      { label: 'Check Alerts', icon: AlertTriangle, view: 'alerts' },
                      { label: 'Reports', icon: FileText, view: 'reports' },
                      { label: 'Predictions', icon: Sparkles, view: 'predictions' },
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: action.view } }));
                          setShowSearch(false);
                        }}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm"
                      >
                        <action.icon className="w-4 h-4 text-primary" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right - Actions */}
      <motion.div 
        className="flex items-center gap-2 md:gap-3 relative z-10"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Mobile Search */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Search className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Voice Assistant */}
        <motion.div 
          className="hidden md:block mr-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
        >
          <AudioOrb size="sm" />
        </motion.div>

        {/* Theme Toggle */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground relative overflow-hidden group"
          >
            <motion.div
              className="relative"
              animate={{ rotate: isDark ? 0 : 180 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.div>
          </Button>
        </motion.div>

        {/* Notifications */}
        <div className="relative">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <motion.span 
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  {alertCount > 9 ? '9+' : alertCount}
                </motion.span>
              )}
            </Button>
          </motion.div>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div 
                  className="fixed inset-0 z-[95]" 
                  onClick={() => setShowNotifications(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
                <motion.div 
                  className="absolute right-0 top-full mt-2 w-80 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-[96]"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="p-3 border-b border-border/50 flex items-center justify-between">
                    <span className="font-semibold text-sm">Notifications</span>
                    <Button variant="ghost" size="sm" className="text-xs h-7">Mark all read</Button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recentAlerts.map((alert, index) => (
                      <motion.div 
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0 cursor-pointer"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'alerts' } }));
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex gap-3">
                          <motion.div 
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                              alert.severity === 'critical' && 'bg-red-500/20 text-red-500',
                              alert.severity === 'warning' && 'bg-yellow-500/20 text-yellow-500',
                              alert.severity === 'info' && 'bg-blue-500/20 text-blue-500'
                            )}
                            animate={alert.severity === 'critical' ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">{alert.vehicleId} • {new Date(alert.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-border/50">
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm h-8"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'alerts' } }));
                        setShowNotifications(false);
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative z-[1000]">
          <button
            onClick={() => {
              console.log('[Header] User menu clicked, current state:', showUserMenu);
              setShowUserMenu(!showUserMenu);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary/60 transition-all duration-200 group border border-transparent hover:border-border/50"
          >
            {/* User Avatar with status indicator */}
            <div className="relative">
              <div 
                className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-background"
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {/* Online status indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
            </div>
            
            {/* User info - always visible on md+ screens */}
            <div className="hidden md:block text-left min-w-[100px]">
              <p className="text-sm font-semibold leading-tight truncate max-w-[120px]">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {user?.role === 'admin' && (
                  <Shield className="w-3 h-3 text-destructive" />
                )}
                <p className="text-xs text-muted-foreground capitalize leading-none">
                  {user?.role || 'viewer'}
                </p>
              </div>
            </div>
            
            {/* Session Info */}
            <SessionInfo />
            
            <div className="hidden md:block">
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showUserMenu && "rotate-180")} />
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-[998]" 
                onClick={() => setShowUserMenu(false)}
              />
              {/* Menu Content */}
              <div 
                className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl overflow-hidden z-[999] shadow-2xl"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
              >
                {/* Header Section with User Info */}
                <div className="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-xl">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
                          roleColors[user?.role || 'viewer']
                        )}>
                          {user?.role === 'admin' && <Shield className="w-3 h-3" />}
                          <span className="capitalize">{user?.role || 'viewer'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary transition-colors text-foreground"
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span>Profile Settings</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary transition-colors text-foreground"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Preferences</span>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-border my-2"></div>

                  {/* Theme Toggle */}
                  <button 
                    onClick={() => toggleTheme()}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary transition-colors text-foreground"
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-500" />
                    )}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    <div className="ml-auto">
                      <div className={cn(
                        "w-8 h-4 rounded-full relative",
                        isDark ? "bg-indigo-500/30" : "bg-yellow-500/30"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 rounded-full transition-all",
                          isDark ? "left-0.5 bg-indigo-500" : "left-4 bg-yellow-500"
                        )} />
                      </div>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-border my-2"></div>

                  {/* Sign Out */}
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </motion.header>
  );
};
