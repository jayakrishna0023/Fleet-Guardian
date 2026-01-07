import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number | ReactNode;
  unit?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'healthy' | 'warning' | 'critical';
  className?: string;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  status,
  className,
}: MetricCardProps) => {
  const statusColors = {
    healthy: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    critical: 'border-destructive/30 bg-destructive/5',
  };

  const statusGlows = {
    healthy: 'group-hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]',
    warning: 'group-hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]',
    critical: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    stable: 'text-muted-foreground',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      className={cn(
        'metric-card group relative overflow-hidden transition-all duration-300',
        status && statusColors[status],
        status && statusGlows[status],
        'hover:border-primary/40 hover:-translate-y-1',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          {icon && (
            <motion.div 
              className="p-2 rounded-lg bg-secondary/50 text-primary group-hover:bg-primary/20 transition-colors"
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              {icon}
            </motion.div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <motion.span 
            className="text-3xl font-bold font-mono tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>

        {trend && trendValue && (
          <motion.div 
            className={cn('flex items-center gap-1 mt-2 text-sm', trendColors[trend])}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={trend === 'up' ? { y: [0, -2, 0] } : trend === 'down' ? { y: [0, 2, 0] } : {}}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              <TrendIcon className="w-4 h-4" />
            </motion.div>
            <span>{trendValue}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
