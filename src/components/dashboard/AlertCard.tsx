import { Alert } from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  XCircle,
  Clock,
  Check,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  onClick?: () => void;
  compact?: boolean;
  index?: number;
}

export const AlertCard = ({ alert, onAcknowledge, onClick, compact = false, index = 0 }: AlertCardProps) => {
  const severityConfig: Record<string, {
    icon: typeof Info;
    bgClass: string;
    borderClass: string;
    iconClass: string;
    badgeClass: string;
    glowColor: string;
  }> = {
    info: {
      icon: Info,
      bgClass: 'bg-muted/50',
      borderClass: 'border-muted-foreground/20',
      iconClass: 'text-muted-foreground',
      badgeClass: 'bg-muted text-muted-foreground',
      glowColor: '0 0 0 0 transparent',
    },
    low: {
      icon: Info,
      bgClass: 'bg-muted/50',
      borderClass: 'border-muted-foreground/20',
      iconClass: 'text-muted-foreground',
      badgeClass: 'bg-muted text-muted-foreground',
      glowColor: '0 0 0 0 transparent',
    },
    warning: {
      icon: AlertCircle,
      bgClass: 'bg-warning/5',
      borderClass: 'border-warning/30',
      iconClass: 'text-warning',
      badgeClass: 'bg-warning/20 text-warning',
      glowColor: '0 0 15px 0 hsl(45 93% 47% / 0.3)',
    },
    medium: {
      icon: AlertCircle,
      bgClass: 'bg-warning/5',
      borderClass: 'border-warning/30',
      iconClass: 'text-warning',
      badgeClass: 'bg-warning/20 text-warning',
      glowColor: '0 0 15px 0 hsl(45 93% 47% / 0.3)',
    },
    high: {
      icon: AlertTriangle,
      bgClass: 'bg-warning/10',
      borderClass: 'border-warning/50',
      iconClass: 'text-warning',
      badgeClass: 'bg-warning/30 text-warning',
      glowColor: '0 0 20px 0 hsl(45 93% 47% / 0.4)',
    },
    critical: {
      icon: XCircle,
      bgClass: 'bg-destructive/10',
      borderClass: 'border-destructive/50',
      iconClass: 'text-destructive',
      badgeClass: 'bg-destructive/30 text-destructive',
      glowColor: '0 0 25px 0 hsl(0 84% 60% / 0.5)',
    },
  };

  const config = severityConfig[alert.severity] || severityConfig.info;
  const Icon = config.icon;

  if (compact) {
    return (
      <motion.button
        onClick={onClick}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ x: 5, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
          'hover:bg-secondary/50 text-left relative overflow-hidden',
          config.bgClass,
          config.borderClass,
          alert.acknowledged && 'opacity-60'
        )}
      >
        {/* Animated gradient line */}
        <motion.div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-0.5',
            alert.severity === 'critical' ? 'bg-destructive' :
            alert.severity === 'warning' || alert.severity === 'high' || alert.severity === 'medium' ? 'bg-warning' : 'bg-muted-foreground'
          )}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        />
        
        <motion.div
          animate={alert.severity === 'critical' ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <Icon className={cn('w-5 h-5 flex-shrink-0', config.iconClass)} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground truncate">{alert.vehicleName}</p>
        </div>
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, boxShadow: config.glowColor }}
      className={cn(
        'glass-panel p-4 border transition-all duration-200 relative overflow-hidden',
        config.bgClass,
        config.borderClass,
        alert.acknowledged && 'opacity-60'
      )}
    >
      {/* Critical alert pulse effect */}
      {alert.severity === 'critical' && !alert.acknowledged && (
        <motion.div
          className="absolute inset-0 bg-destructive/5 rounded-xl"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Scan line effect for critical/high */}
      {(alert.severity === 'critical' || alert.severity === 'high') && !alert.acknowledged && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none"
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="flex items-start gap-4 relative z-10">
        <motion.div 
          className={cn('p-2 rounded-lg relative', config.bgClass)}
          animate={alert.severity === 'critical' ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Icon className={cn('w-5 h-5 relative z-10', config.iconClass)} />
          {alert.severity === 'critical' && (
            <motion.div
              className="absolute inset-0 rounded-lg bg-destructive/30"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <motion.span 
              className={cn('text-xs font-medium px-2 py-0.5 rounded-full uppercase', config.badgeClass)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.1, type: 'spring', stiffness: 400 }}
            >
              {alert.severity}
            </motion.span>
            <span className="text-xs text-muted-foreground">{alert.type}</span>
            {alert.severity === 'critical' && (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-3 h-3 text-destructive" />
              </motion.div>
            )}
          </div>
          
          <motion.h4 
            className="font-semibold mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.15 }}
          >
            {alert.title}
          </motion.h4>
          <motion.p 
            className="text-sm text-muted-foreground mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            {alert.description}
          </motion.p>
          
          <motion.div 
            className="flex items-center gap-4 text-xs text-muted-foreground"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.25 }}
          >
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
            </span>
            <span>{alert.vehicleName}</span>
            {alert.component && <span>• {alert.component}</span>}
            {alert.probability && (
              <span className="font-mono">• {(alert.probability * 100).toFixed(0)}% probability</span>
            )}
          </motion.div>
          
          {alert.acknowledged && (
            <motion.p 
              className="text-xs text-muted-foreground mt-2 flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Check className="w-3 h-3" />
              Acknowledged by {alert.acknowledgedBy}
            </motion.p>
          )}
        </div>
        
        {!alert.acknowledged && onAcknowledge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(alert.id)}
              className="relative overflow-hidden group"
            >
              <span className="relative z-10">Acknowledge</span>
              <motion.div
                className="absolute inset-0 bg-primary/10"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
