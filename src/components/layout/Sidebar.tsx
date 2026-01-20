import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Car, 
  AlertTriangle, 
  Brain,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
  Users,
  Sparkles,
  BarChart3,
  AlertOctagon,
  Lightbulb,
  GitCompare,
  Trophy,
  Mail,
} from 'lucide-react';
import { UserRole } from '@/types/auth';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  userRole?: UserRole;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Fleet Vehicles', icon: Car },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'predictions', label: 'Predictions', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'advanced-analytics', label: 'Advanced AI', icon: BarChart3 },
  { id: 'anomaly-detection', label: 'Anomaly Detection', icon: AlertOctagon },
  { id: 'smart-insights', label: 'Smart Insights', icon: Lightbulb },
  { id: 'vehicle-compare', label: 'Compare Vehicles', icon: GitCompare },
  { id: 'driver-leaderboard', label: 'Driver Rankings', icon: Trophy },
  { id: 'email-center', label: 'Email Center', icon: Mail },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'upload', label: 'Data Upload', icon: Upload },
];

const adminItems = [
  { id: 'admin', label: 'Admin Panel', icon: Shield },
];

export const Sidebar = ({ activeView, onViewChange, collapsed, onToggle, userRole }: SidebarProps) => {
  const showAdminItems = userRole === 'admin';
  
  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col relative overflow-hidden"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 opacity-50" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{ left: `${20 + i * 15}%` }}
            animate={{
              y: ['100%', '-100%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              delay: i * 2,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border relative z-10">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center relative"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Activity className="w-5 h-5 text-primary-foreground" />
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gradient">FleetAI</span>
                <span className="text-[10px] text-muted-foreground -mt-1">Fleet Management</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn('text-sidebar-foreground hover:bg-sidebar-accent relative', collapsed && 'mx-auto')}
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto relative z-10">
        {/* Main Navigation Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p 
              className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              Main Menu
            </motion.p>
          )}
        </AnimatePresence>
        
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onViewChange(item.id)}
              whileHover={{ x: collapsed ? 0 : 5 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative',
                'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              {/* Active indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-sidebar-primary"
                    layoutId="activeNav"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              
              {/* Glow effect for active */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  animate={{ 
                    boxShadow: ['0 0 0 0 hsl(var(--primary) / 0)', '0 0 20px 0 hsl(var(--primary) / 0.3)', '0 0 0 0 hsl(var(--primary) / 0)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              <motion.div
                className="relative z-10"
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-current')} />
              </motion.div>
              
              <AnimatePresence>
                {!collapsed && (
                  <motion.span 
                    className="font-medium relative z-10"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        {/* Admin Section */}
        {showAdminItems && (
          <>
            <AnimatePresence>
              {!collapsed && (
                <motion.p 
                  className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  Administration
                </motion.p>
              )}
            </AnimatePresence>
            {adminItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => onViewChange(item.id)}
                  whileHover={{ x: collapsed ? 0 : 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden',
                    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive && 'bg-gradient-to-r from-destructive/80 to-destructive text-destructive-foreground',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  {/* Animated gradient background for admin */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-destructive via-destructive/80 to-destructive"
                      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      style={{ backgroundSize: '200% 200%' }}
                    />
                  )}
                  
                  <motion.div
                    className="relative z-10"
                    animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-current')} />
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span 
                        className="font-medium relative z-10"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </>
        )}
      </nav>

      {/* Pro badge at bottom */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="p-4 border-t border-sidebar-border relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <motion.div
              className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20"
              whileHover={{ scale: 1.02 }}
              animate={{ 
                boxShadow: ['0 0 0 0 hsl(var(--primary) / 0)', '0 0 15px 0 hsl(var(--primary) / 0.2)', '0 0 0 0 hsl(var(--primary) / 0)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-semibold text-primary">AI-Powered</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Advanced fleet analytics & predictions
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
