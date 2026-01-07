// Animated UI Components with GSAP and Framer Motion
import React, { useRef, useEffect, ReactNode } from 'react';
import { motion, useInView, useSpring, useTransform, useScroll, MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer, cardHover, magneticHover } from '@/lib/animations';

// ============ ANIMATED CARD ============
interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

export const AnimatedCard = ({ 
  children, 
  className, 
  delay = 0, 
  hover = true,
  glow = false,
  gradient = false,
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={hover ? { 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3 }
      } : undefined}
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/10 bg-card/80 backdrop-blur-xl',
        glow && 'shadow-[0_0_30px_rgba(99,102,241,0.15)]',
        gradient && 'bg-gradient-to-br from-card via-card to-primary/5',
        'transition-shadow duration-500',
        className
      )}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};

// ============ PARALLAX SECTION ============
interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export const ParallaxSection = ({ children, className, speed = 0.5 }: ParallaxSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);
  
  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============ STAGGER CONTAINER ============
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer = ({ children, className, staggerDelay = 0.1 }: StaggerContainerProps) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============ STAGGER ITEM ============
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

const staggerItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

export const StaggerItem = ({ children, className }: StaggerItemProps) => {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============ FADE IN VIEW ============
interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const FadeInView = ({ 
  children, 
  className, 
  direction = 'up',
  delay = 0,
  duration = 0.6,
  once = true,
}: FadeInViewProps) => {
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.3 }}
      transition={{ 
        duration, 
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============ MAGNETIC BUTTON ============
interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MagneticButton = ({ children, className, onClick }: MagneticButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'translate(0, 0)';
    }
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn('transition-transform duration-200', className)}
    >
      {children}
    </motion.button>
  );
};

// ============ GLOW CARD ============
interface GlowCardProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export const GlowCard = ({ children, className, color = 'primary' }: GlowCardProps) => {
  const colors = {
    primary: 'from-primary/50 via-primary/30',
    success: 'from-success/50 via-success/30',
    warning: 'from-warning/50 via-warning/30',
    destructive: 'from-destructive/50 via-destructive/30',
    accent: 'from-accent/50 via-accent/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={cn('relative group', className)}
    >
      {/* Animated glow background */}
      <div className={cn(
        'absolute -inset-1 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-70 blur-xl transition-all duration-500',
        colors[color as keyof typeof colors] || colors.primary,
        'to-transparent'
      )} />
      <div className="relative glass-panel">
        {children}
      </div>
    </motion.div>
  );
};

// ============ COUNTER ANIMATION ============
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter = ({ 
  value, 
  duration = 2, 
  prefix = '', 
  suffix = '',
  className,
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { duration: duration * 1000 });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  const display = useTransform(spring, (latest) => `${prefix}${Math.round(latest)}${suffix}`);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
};

// ============ SHIMMER TEXT ============
interface ShimmerTextProps {
  children: string;
  className?: string;
}

export const ShimmerText = ({ children, className }: ShimmerTextProps) => {
  return (
    <span
      className={cn(
        'inline-block bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer',
        className
      )}
    >
      {children}
    </span>
  );
};

// ============ FLOATING ELEMENT ============
interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}

export const FloatingElement = ({ 
  children, 
  className,
  amplitude = 10,
  duration = 3,
}: FloatingElementProps) => {
  return (
    <motion.div
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        ease: 'easeInOut' 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============ ROTATING BORDER ============
interface RotatingBorderProps {
  children: ReactNode;
  className?: string;
}

export const RotatingBorder = ({ children, className }: RotatingBorderProps) => {
  return (
    <div className={cn('relative p-[2px] rounded-xl overflow-hidden', className)}>
      <div className="absolute inset-0 animate-spin-slow">
        <div className="absolute inset-0 bg-gradient-conic from-primary via-accent to-primary" />
      </div>
      <div className="relative bg-card rounded-xl">
        {children}
      </div>
    </div>
  );
};

// ============ PULSE RING ============
interface PulseRingProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export const PulseRing = ({ children, className, color = 'primary' }: PulseRingProps) => {
  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'absolute inset-0 rounded-full animate-ping opacity-25',
        color === 'primary' && 'bg-primary',
        color === 'success' && 'bg-success',
        color === 'warning' && 'bg-warning',
        color === 'destructive' && 'bg-destructive',
      )} />
      <div className={cn(
        'absolute inset-0 rounded-full animate-pulse opacity-50',
        color === 'primary' && 'bg-primary',
        color === 'success' && 'bg-success',
        color === 'warning' && 'bg-warning',
        color === 'destructive' && 'bg-destructive',
      )} />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

// ============ TYPEWRITER TEXT ============
interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export const TypewriterText = ({ text, className, speed = 50 }: TypewriterTextProps) => {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={cn('font-mono', className)}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// ============ GRADIENT ORB ============
interface GradientOrbProps {
  className?: string;
  size?: number;
  blur?: number;
}

export const GradientOrb = ({ className, size = 300, blur = 100 }: GradientOrbProps) => {
  return (
    <motion.div
      animate={{
        x: [0, 100, 50, 0],
        y: [0, 50, 100, 0],
        scale: [1, 1.2, 0.9, 1],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn('absolute rounded-full pointer-events-none', className)}
      style={{
        width: size,
        height: size,
        filter: `blur(${blur}px)`,
        background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
      }}
    />
  );
};

// ============ SPOTLIGHT ============
interface SpotlightProps {
  className?: string;
  fill?: string;
}

export const Spotlight = ({ className, fill = 'white' }: SpotlightProps) => {
  return (
    <svg
      className={cn(
        'animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0',
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur_1065_8" />
        </filter>
      </defs>
    </svg>
  );
};

// ============ GRID PATTERN ============
export const GridPattern = ({ className }: { className?: string }) => {
  return (
    <div className={cn(
      'absolute inset-0 overflow-hidden pointer-events-none',
      className
    )}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
};

// ============ PARTICLES ============
export const ParticlesBackground = ({ className }: { className?: string }) => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};
