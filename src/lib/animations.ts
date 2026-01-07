// Animation utilities and GSAP configurations
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Easing functions
export const easings = {
  smooth: 'power2.out',
  bounce: 'bounce.out',
  elastic: 'elastic.out(1, 0.5)',
  back: 'back.out(1.7)',
  expo: 'expo.out',
  circ: 'circ.out',
};

// Animation presets
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export const scaleInBounce = {
  initial: { opacity: 0, scale: 0 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 }
  },
  exit: { opacity: 0, scale: 0 },
};

export const slideInFromBottom = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

export const rotateIn = {
  initial: { opacity: 0, rotate: -10, scale: 0.9 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 10, scale: 0.9 },
};

// Stagger children animation
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
};

// Parallax effect
export const parallax = (offset: number = 50) => ({
  initial: { y: offset },
  whileInView: { y: 0 },
  viewport: { once: false, amount: 0.3 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
});

// Magnetic button effect
export const magneticHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

// Glow pulse effect
export const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(99, 102, 241, 0)',
      '0 0 20px 10px rgba(99, 102, 241, 0.3)',
      '0 0 0 0 rgba(99, 102, 241, 0)',
    ],
  },
  transition: { duration: 2, repeat: Infinity },
};

// Floating animation
export const floating = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Shimmer effect
export const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'linear',
  },
};

// Typewriter effect helper
export const typewriterVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.05 },
  }),
};

// Card hover effect
export const cardHover = {
  initial: { 
    scale: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  whileHover: { 
    scale: 1.02,
    y: -5,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  whileTap: { scale: 0.98 },
};

// 3D tilt effect
export const tilt3D = {
  whileHover: {
    rotateX: 5,
    rotateY: 5,
    transition: { duration: 0.3 }
  },
};

// Morphing background
export const morphBackground = {
  animate: {
    background: [
      'linear-gradient(45deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #8b5cf6, #06b6d4)',
      'linear-gradient(225deg, #06b6d4, #10b981)',
      'linear-gradient(315deg, #10b981, #6366f1)',
    ],
  },
  transition: { duration: 8, repeat: Infinity },
};

// GSAP ScrollTrigger helpers
export const createScrollTrigger = (element: string | Element, animation: gsap.TweenVars) => {
  return gsap.to(element, {
    ...animation,
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    },
  });
};

export const createParallaxScroll = (element: string | Element, speed: number = 0.5) => {
  return gsap.to(element, {
    y: () => window.innerHeight * speed,
    ease: 'none',
    scrollTrigger: {
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
};

// Number counter animation
export const countUp = (
  element: Element,
  endValue: number,
  duration: number = 2,
  prefix: string = '',
  suffix: string = ''
) => {
  const obj = { value: 0 };
  return gsap.to(obj, {
    value: endValue,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = `${prefix}${Math.round(obj.value)}${suffix}`;
    },
  });
};

// Text reveal animation
export const textReveal = (element: string | Element) => {
  return gsap.fromTo(
    element,
    { 
      clipPath: 'inset(0 100% 0 0)',
      opacity: 0,
    },
    { 
      clipPath: 'inset(0 0% 0 0)',
      opacity: 1,
      duration: 1,
      ease: 'power4.out',
    }
  );
};

export { gsap, ScrollTrigger };
