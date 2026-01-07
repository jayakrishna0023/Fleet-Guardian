import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, useSpring, useTransform } from 'framer-motion';

interface HealthGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export const HealthGauge = ({ 
  score, 
  size = 'md', 
  showLabel = true,
  label = 'Health Score',
  animated = true 
}: HealthGaugeProps) => {
  const { strokeColor, glowClass, status, bgGlow } = useMemo(() => {
    if (score >= 80) {
      return { 
        strokeColor: 'hsl(var(--success))', 
        glowClass: 'glow-success',
        status: 'Healthy',
        bgGlow: 'hsl(142 71% 45% / 0.1)'
      };
    } else if (score >= 50) {
      return { 
        strokeColor: 'hsl(var(--warning))', 
        glowClass: 'glow-warning',
        status: 'Warning',
        bgGlow: 'hsl(45 93% 47% / 0.1)'
      };
    } else {
      return { 
        strokeColor: 'hsl(var(--destructive))', 
        glowClass: 'glow-destructive',
        status: 'Critical',
        bgGlow: 'hsl(0 84% 60% / 0.1)'
      };
    }
  }, [score]);

  const sizeConfig = {
    sm: { container: 'w-20 h-20', stroke: 6, fontSize: 'text-lg', labelSize: 'text-[10px]' },
    md: { container: 'w-32 h-32', stroke: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
    lg: { container: 'w-44 h-44', stroke: 10, fontSize: 'text-4xl', labelSize: 'text-sm' },
  };

  const config = sizeConfig[size];
  const radius = 50 - config.stroke / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated score value
  const springScore = useSpring(0, { stiffness: 50, damping: 20 });
  const displayScore = useTransform(springScore, Math.round);
  
  // Update spring when score changes
  if (animated) {
    springScore.set(score);
  }

  return (
    <motion.div 
      className={cn('relative flex flex-col items-center', config.container)}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Pulsing background glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: bgGlow }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg className="w-full h-full -rotate-90 transform relative z-10" viewBox="0 0 100 100">
        {/* Background circle with subtle animation */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={config.stroke}
          className="opacity-30"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Animated progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{
            filter: `drop-shadow(0 0 10px ${strokeColor})`,
          }}
        />

        {/* Glowing dot at the end of progress */}
        <motion.circle
          cx="50"
          cy={50 - radius}
          r={config.stroke / 2 + 1}
          fill={strokeColor}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.3 }}
          style={{
            filter: `drop-shadow(0 0 6px ${strokeColor})`,
            transformOrigin: '50px 50px',
            transform: `rotate(${(score / 100) * 360}deg)`,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <motion.span 
          className={cn('font-mono font-bold', config.fontSize)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          {animated ? <motion.span>{displayScore}</motion.span> : score}
        </motion.span>
        {showLabel && (
          <motion.span 
            className={cn('text-muted-foreground', config.labelSize)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {label}
          </motion.span>
        )}
        
        {/* Status indicator */}
        <motion.div
          className={cn(
            'mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
            score >= 80 && 'bg-success/20 text-success',
            score >= 50 && score < 80 && 'bg-warning/20 text-warning',
            score < 50 && 'bg-destructive/20 text-destructive'
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
        >
          {status}
        </motion.div>
      </div>

      {/* Decorative rotating ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-dashed opacity-20"
        style={{ borderColor: strokeColor }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
};
