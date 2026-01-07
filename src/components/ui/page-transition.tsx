import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  duration: 0.4,
};

export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Staggered children animation wrapper
interface StaggeredPageProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggeredPage = ({ 
  children, 
  className = '', 
  staggerDelay = 0.1 
}: StaggeredPageProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Individual staggered item
export const StaggeredItem = ({ 
  children, 
  className = '' 
}: { children: ReactNode; className?: string }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Slide in from different directions
interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

export const SlideIn = ({ 
  children, 
  direction = 'up', 
  delay = 0, 
  className = '' 
}: SlideInProps) => {
  const directionOffset = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    up: { x: 0, y: 50 },
    down: { x: 0, y: -50 },
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directionOffset[direction] 
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.16, 1, 0.3, 1] 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Scale in animation
interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const ScaleIn = ({ 
  children, 
  delay = 0, 
  className = '' 
}: ScaleInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Blur fade in
export const BlurFadeIn = ({ 
  children, 
  delay = 0, 
  className = '' 
}: ScaleInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.16, 1, 0.3, 1] 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Reveal from clip-path
export const RevealIn = ({ 
  children, 
  delay = 0, 
  className = '' 
}: ScaleInProps) => {
  return (
    <motion.div
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      animate={{ clipPath: 'inset(0 0% 0 0)' }}
      transition={{ 
        duration: 0.8, 
        delay,
        ease: [0.16, 1, 0.3, 1] 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Hover card with 3D effect
interface HoverCard3DProps {
  children: ReactNode;
  className?: string;
}

export const HoverCard3D = ({ children, className = '' }: HoverCard3DProps) => {
  return (
    <motion.div
      whileHover={{ 
        rotateY: 5,
        rotateX: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Floating animation
interface FloatingProps {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  className?: string;
}

export const Floating = ({ 
  children, 
  amplitude = 10, 
  duration = 3,
  className = '' 
}: FloatingProps) => {
  return (
    <motion.div
      animate={{ 
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{ 
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Pulsing glow effect
interface PulsingGlowProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export const PulsingGlow = ({ 
  children, 
  color = 'hsl(var(--primary))', 
  className = '' 
}: PulsingGlowProps) => {
  return (
    <motion.div
      animate={{ 
        boxShadow: [
          `0 0 0 0 ${color.replace(')', ' / 0)')}`,
          `0 0 30px 10px ${color.replace(')', ' / 0.3)')}`,
          `0 0 0 0 ${color.replace(')', ' / 0)')}`,
        ],
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Morphing blob background
export const MorphingBlob = ({ 
  className = '',
  color = 'hsl(var(--primary) / 0.2)',
}: { 
  className?: string;
  color?: string;
}) => {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      style={{ backgroundColor: color }}
      animate={{
        scale: [1, 1.2, 0.9, 1.1, 1],
        rotate: [0, 90, 180, 270, 360],
        borderRadius: ['50%', '40%', '60%', '45%', '50%'],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

// Text character animation
interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const AnimatedText = ({ 
  text, 
  className = '', 
  delay = 0 
}: AnimatedTextProps) => {
  return (
    <motion.span className={className}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay + index * 0.03,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Counter animation
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedNumber = ({ 
  value, 
  duration = 1,
  className = '' 
}: AnimatedNumberProps) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        initial={{ '--num': 0 } as any}
        animate={{ '--num': value } as any}
        transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
      >
        {Math.round(value)}
      </motion.span>
    </motion.span>
  );
};
