import { PredictiveInsight } from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface PredictiveInsightCardProps {
  insight: PredictiveInsight;
  index?: number;
}

export const PredictiveInsightCard = ({ insight, index = 0 }: PredictiveInsightCardProps) => {
  const riskLevel = insight.failureProbability >= 0.7 ? 'critical' 
    : insight.failureProbability >= 0.4 ? 'warning' 
    : 'healthy';

  const riskConfig = {
    healthy: {
      bgClass: 'bg-success/10 border-success/30',
      progressClass: 'bg-success',
      icon: CheckCircle,
      iconClass: 'text-success',
      glowColor: '0 0 20px 0 hsl(142 71% 45% / 0.3)',
    },
    warning: {
      bgClass: 'bg-warning/10 border-warning/30',
      progressClass: 'bg-warning',
      icon: AlertTriangle,
      iconClass: 'text-warning',
      glowColor: '0 0 20px 0 hsl(45 93% 47% / 0.3)',
    },
    critical: {
      bgClass: 'bg-destructive/10 border-destructive/30',
      progressClass: 'bg-destructive',
      icon: AlertTriangle,
      iconClass: 'text-destructive',
      glowColor: '0 0 25px 0 hsl(0 84% 60% / 0.4)',
    },
  };

  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  const trendConfig = {
    improving: { icon: TrendingUp, class: 'text-success', label: 'Improving' },
    stable: { icon: Minus, class: 'text-muted-foreground', label: 'Stable' },
    degrading: { icon: TrendingDown, class: 'text-destructive', label: 'Degrading' },
  };

  const trend = trendConfig[insight.trend];
  const TrendIcon = trend.icon;

  const formatRUL = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    if (hours < 168) return `${Math.floor(hours / 24)}d`;
    return `${Math.floor(hours / 168)}w`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: config.glowColor }}
      className={cn('glass-panel p-4 border relative overflow-hidden', config.bgClass)}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Pulse ring for critical */}
      {riskLevel === 'critical' && (
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-full h-full rounded-full bg-destructive" />
        </motion.div>
      )}
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.1 }}
          >
            <motion.div
              animate={riskLevel === 'critical' ? { rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Icon className={cn('w-4 h-4', config.iconClass)} />
            </motion.div>
            <h4 className="font-semibold">{insight.component}</h4>
          </motion.div>
          <motion.div 
            className={cn('flex items-center gap-1 text-xs', trend.class)}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.15 }}
          >
            <motion.div
              animate={insight.trend === 'degrading' ? { y: [0, 2, 0] } : insight.trend === 'improving' ? { y: [0, -2, 0] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <TrendIcon className="w-3 h-3" />
            </motion.div>
            <span>{trend.label}</span>
          </motion.div>
        </div>

        {/* Failure Probability */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.2 }}
        >
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Failure Risk</span>
            <motion.span 
              className={cn('font-mono font-medium', 
                riskLevel === 'critical' && 'text-destructive',
                riskLevel === 'warning' && 'text-warning',
                riskLevel === 'healthy' && 'text-success'
              )}
              animate={riskLevel === 'critical' ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {(insight.failureProbability * 100).toFixed(0)}%
            </motion.span>
          </div>
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', config.progressClass)}
              initial={{ width: 0 }}
              animate={{ width: `${insight.failureProbability * 100}%` }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>

        {/* RUL and Confidence */}
        <motion.div 
          className="grid grid-cols-2 gap-4 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.35 }}
        >
          <div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. Time Left
            </p>
            <motion.p 
              className="font-mono font-semibold text-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.4, type: 'spring', stiffness: 300 }}
            >
              {formatRUL(insight.remainingUsefulLife)}
            </motion.p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Model Confidence
            </p>
            <motion.p 
              className="font-mono font-semibold text-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.45, type: 'spring', stiffness: 300 }}
            >
              {(insight.confidence * 100).toFixed(0)}%
            </motion.p>
          </div>
        </motion.div>

        {/* Recommendation */}
        <motion.div 
          className="pt-3 border-t border-border/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.5 }}
        >
          <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
          <p className="text-sm">{insight.recommendation}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};
