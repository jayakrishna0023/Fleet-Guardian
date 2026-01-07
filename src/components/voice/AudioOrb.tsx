import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { voiceAssistantService, VoiceState } from '@/services/voiceAssistant';
import { aiService } from '@/services/aiService';
import { Mic, MicOff, Sparkles, Volume2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPanel?: boolean;
}

/**
 * Premium AI Voice Assistant Orb
 * Features:
 * - Fluid morphing blob animation
 * - Dynamic particle system
 * - Glassmorphism panel
 * - Sound wave visualization
 * - Multiple voice options
 * - Professional state transitions
 */
const AudioOrb: React.FC<AudioOrbProps> = ({ className, size = 'md', showPanel = false }) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [isActive, setIsActive] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const blobsRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  
  const isSupported = voiceAssistantService.isSupported();

  const sizeMap = {
    sm: { container: 44, canvas: 100, icon: 16, ring: 52 },
    md: { container: 60, canvas: 140, icon: 22, ring: 72 },
    lg: { container: 80, canvas: 180, icon: 28, ring: 96 },
    xl: { container: 120, canvas: 260, icon: 36, ring: 140 },
  };

  const dimensions = sizeMap[size];

  // Particle class for ambient effects
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;

    constructor(centerX: number, centerY: number, radius: number) {
      const angle = Math.random() * Math.PI * 2;
      const dist = radius * (0.5 + Math.random() * 0.5);
      this.x = centerX + Math.cos(angle) * dist;
      this.y = centerY + Math.sin(angle) * dist;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.life = 1;
      this.maxLife = 60 + Math.random() * 60;
      this.size = 1 + Math.random() * 2;
      this.color = `hsla(${220 + Math.random() * 40}, 80%, 70%, `;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 1 / this.maxLife;
      return this.life > 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.life * 0.6 + ')';
      ctx.fill();
    }
  }

  // Enhanced Blob class for organic animation
  class Blob {
    x: number;
    y: number;
    radius: number;
    baseRadius: number;
    angle: number;
    speed: number;
    color: string;
    phase: number;
    noiseOffset: number;

    constructor(centerX: number, centerY: number, radius: number, color: string, phase: number) {
      this.x = centerX;
      this.y = centerY;
      this.radius = radius;
      this.baseRadius = radius;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = 0.015 + Math.random() * 0.015;
      this.color = color;
      this.phase = phase;
      this.noiseOffset = Math.random() * 100;
    }

    update(amplitude: number, isActive: boolean, time: number) {
      this.angle += this.speed;
      const pulse = isActive ? 1 + amplitude * 0.4 : 1;
      const breathe = Math.sin(time / 1000 + this.phase) * (isActive ? 0.12 : 0.05);
      const wave = Math.sin(this.angle * 2 + this.phase) * (isActive ? 0.08 : 0.03);
      this.radius = this.baseRadius * pulse * (1 + breathe + wave);
    }

    draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) {
      ctx.beginPath();
      
      const points = 80;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noise1 = Math.sin(angle * 4 + this.angle + this.noiseOffset) * 0.08;
        const noise2 = Math.sin(angle * 6 - time / 500 + this.phase) * 0.04;
        const noise3 = Math.sin(angle * 2 + time / 800) * 0.03;
        const r = this.radius * (1 + noise1 + noise2 + noise3);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  // Initialize blobs and particles
  useEffect(() => {
    const centerX = dimensions.canvas / 2;
    const centerY = dimensions.canvas / 2;
    const baseRadius = dimensions.container / 2 - 2;

    blobsRef.current = [
      new Blob(centerX, centerY, baseRadius * 1.2, 'rgba(99, 102, 241, 0.15)', 0),
      new Blob(centerX, centerY, baseRadius * 1.05, 'rgba(139, 92, 246, 0.25)', 0.8),
      new Blob(centerX, centerY, baseRadius * 0.95, 'rgba(79, 70, 229, 0.35)', 1.6),
      new Blob(centerX, centerY, baseRadius * 0.85, 'rgba(99, 102, 241, 0.5)', 2.4),
      new Blob(centerX, centerY, baseRadius * 0.7, 'rgba(129, 140, 248, 0.7)', 3.2),
    ];
  }, [dimensions]);

  // Voice assistant callbacks
  useEffect(() => {
    voiceAssistantService.onStateChange = (s) => {
      setState(s);
      setIsActive(s === 'listening' || s === 'processing' || s === 'speaking');
    };
    
    voiceAssistantService.onTranscript = (text) => {
      setTranscript(text);
    };

    voiceAssistantService.onResponse = (text) => {
      setResponse(text);
    };
    
    return () => {
      voiceAssistantService.onStateChange = null;
      voiceAssistantService.onTranscript = null;
      voiceAssistantService.onResponse = null;
    };
  }, []);

  // Simulate amplitude from voice activity
  useEffect(() => {
    if (!isActive) {
      setAmplitude(0);
      return;
    }

    const interval = setInterval(() => {
      if (state === 'listening') {
        setAmplitude(0.4 + Math.random() * 0.6);
      } else if (state === 'speaking') {
        setAmplitude(0.5 + Math.sin(Date.now() / 80) * 0.4);
      } else if (state === 'processing') {
        setAmplitude(0.3 + Math.sin(Date.now() / 150) * 0.2);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isActive, state]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = dimensions.canvas / 2;
    const centerY = dimensions.canvas / 2;
    const time = Date.now();

    ctx.clearRect(0, 0, dimensions.canvas, dimensions.canvas);

    // Ambient glow
    if (isActive) {
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, dimensions.canvas / 2
      );
      
      if (state === 'listening') {
        glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
        glowGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
        glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else if (state === 'speaking') {
        glowGradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        glowGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
        glowGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
        glowGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.06)');
        glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      }
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, dimensions.canvas, dimensions.canvas);
    }

    // Update particles
    if (isActive) {
      if (Math.random() > 0.7) {
        particlesRef.current.push(new Particle(centerX, centerY, dimensions.container / 2));
      }
    }
    particlesRef.current = particlesRef.current.filter(p => p.update());
    particlesRef.current.forEach(p => p.draw(ctx));

    // Update blob colors based on state
    const stateColors = {
      listening: [
        'rgba(59, 130, 246, 0.15)',
        'rgba(96, 165, 250, 0.25)',
        'rgba(59, 130, 246, 0.35)',
        'rgba(37, 99, 235, 0.5)',
        'rgba(147, 197, 253, 0.7)',
      ],
      speaking: [
        'rgba(16, 185, 129, 0.15)',
        'rgba(52, 211, 153, 0.25)',
        'rgba(16, 185, 129, 0.35)',
        'rgba(5, 150, 105, 0.5)',
        'rgba(110, 231, 183, 0.7)',
      ],
      processing: [
        'rgba(139, 92, 246, 0.15)',
        'rgba(167, 139, 250, 0.25)',
        'rgba(139, 92, 246, 0.35)',
        'rgba(124, 58, 237, 0.5)',
        'rgba(196, 181, 253, 0.7)',
      ],
      idle: [
        'rgba(99, 102, 241, 0.12)',
        'rgba(139, 92, 246, 0.2)',
        'rgba(79, 70, 229, 0.28)',
        'rgba(99, 102, 241, 0.4)',
        'rgba(129, 140, 248, 0.6)',
      ],
    };

    const colors = stateColors[state];
    blobsRef.current.forEach((blob, index) => {
      blob.color = colors[index];
      blob.update(amplitude, isActive, time);
      blob.draw(ctx, centerX, centerY, time);
    });

    // Core orb with enhanced gradient
    const coreRadius = dimensions.container / 4;
    const coreGradient = ctx.createRadialGradient(
      centerX - coreRadius * 0.3, centerY - coreRadius * 0.3, 0,
      centerX, centerY, coreRadius
    );
    
    if (state === 'listening') {
      coreGradient.addColorStop(0, '#bfdbfe');
      coreGradient.addColorStop(0.4, '#3b82f6');
      coreGradient.addColorStop(1, '#1e40af');
    } else if (state === 'speaking') {
      coreGradient.addColorStop(0, '#a7f3d0');
      coreGradient.addColorStop(0.4, '#10b981');
      coreGradient.addColorStop(1, '#047857');
    } else if (state === 'processing') {
      coreGradient.addColorStop(0, '#ddd6fe');
      coreGradient.addColorStop(0.4, '#8b5cf6');
      coreGradient.addColorStop(1, '#5b21b6');
    } else {
      coreGradient.addColorStop(0, '#e0e7ff');
      coreGradient.addColorStop(0.4, '#6366f1');
      coreGradient.addColorStop(1, '#3730a3');
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();

    // Premium shine effect
    const shineGradient = ctx.createLinearGradient(
      centerX - coreRadius,
      centerY - coreRadius,
      centerX + coreRadius * 0.5,
      centerY + coreRadius * 0.5
    );
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    shineGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius - 1, 0, Math.PI * 2);
    ctx.fillStyle = shineGradient;
    ctx.fill();

    // Sound wave rings when speaking
    if (state === 'speaking') {
      const waveCount = 3;
      for (let i = 0; i < waveCount; i++) {
        const progress = ((time / 1000 + i / waveCount) % 1);
        const waveRadius = coreRadius + (dimensions.container / 2 - coreRadius) * progress;
        const alpha = (1 - progress) * 0.3;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [amplitude, isActive, state, dimensions]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const handleClick = () => {
    if (!isSupported) {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { 
          title: 'Voice not supported', 
          description: 'Your browser does not support speech recognition.' 
        } 
      }));
      return;
    }

    const isListening = voiceAssistantService.getListeningState();
    
    if (!isListening) {
      if (aiService.isConfigured()) {
        voiceAssistantService.setResponder(async (prompt: string, context: string) => {
          return await aiService.chat(prompt, context);
        });
      } else {
        voiceAssistantService.setResponder(undefined);
      }
      setTranscript('');
      setResponse('');
      voiceAssistantService.start();
    } else {
      voiceAssistantService.stop();
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
      default: return 'Tap to speak';
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'listening': return 'text-blue-400';
      case 'processing': return 'text-purple-400';
      case 'speaking': return 'text-emerald-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main Orb Button */}
      <motion.div
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Outer glow ring */}
        <motion.div
          className={cn(
            'absolute rounded-full transition-all duration-500',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
          )}
          style={{
            width: dimensions.ring,
            height: dimensions.ring,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: state === 'listening' 
              ? 'conic-gradient(from 0deg, rgba(59, 130, 246, 0.4), rgba(147, 197, 253, 0.4), rgba(59, 130, 246, 0.4))'
              : state === 'speaking'
              ? 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.4), rgba(110, 231, 183, 0.4), rgba(16, 185, 129, 0.4))'
              : 'conic-gradient(from 0deg, rgba(139, 92, 246, 0.4), rgba(196, 181, 253, 0.4), rgba(139, 92, 246, 0.4))',
          }}
          animate={isActive ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 3, repeat: isActive ? Infinity : 0, ease: 'linear' }}
        />

        <button
          onClick={handleClick}
          aria-label="AI Voice Assistant"
          className={cn(
            'relative rounded-full overflow-visible',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background',
          )}
          style={{ 
            width: dimensions.container, 
            height: dimensions.container,
          }}
        >
          <canvas
            ref={canvasRef}
            width={dimensions.canvas}
            height={dimensions.canvas}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: dimensions.canvas,
              height: dimensions.canvas,
            }}
          />

          {/* Icon overlay */}
          <AnimatePresence mode="wait">
            {!isActive ? (
              <motion.div
                key="mic"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Mic 
                  className="text-white drop-shadow-lg"
                  style={{ width: dimensions.icon, height: dimensions.icon }}
                />
              </motion.div>
            ) : state === 'listening' ? (
              <motion.div
                key="waveform"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex items-end gap-0.5 h-5">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-white rounded-full"
                      animate={{
                        height: [4, 12 + Math.random() * 8, 4],
                      }}
                      transition={{
                        duration: 0.4 + Math.random() * 0.2,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : state === 'processing' ? (
              <motion.div
                key="sparkles"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles 
                    className="text-white drop-shadow-lg"
                    style={{ width: dimensions.icon, height: dimensions.icon }}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="volume"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Volume2 
                    className="text-white drop-shadow-lg"
                    style={{ width: dimensions.icon, height: dimensions.icon }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active pulse ring */}
          {isActive && (
            <motion.div
              className={cn(
                'absolute inset-0 rounded-full border-2',
                state === 'listening' && 'border-blue-400',
                state === 'speaking' && 'border-emerald-400',
                state === 'processing' && 'border-purple-400',
              )}
              animate={{ scale: [1, 1.3, 1.3], opacity: [0.8, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </button>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50',
            isActive && 'opacity-100'
          )}
        >
          <div className={cn(
            'bg-popover/95 backdrop-blur-sm text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-border/50 font-medium',
            getStatusColor()
          )}>
            {getStatusText()}
          </div>
        </motion.div>
      </motion.div>

      {/* Expanded Panel for transcript/response */}
      <AnimatePresence>
        {(showPanel || showExpanded) && isActive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-4 right-0 w-80 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  state === 'listening' && 'bg-blue-500 animate-pulse',
                  state === 'processing' && 'bg-purple-500 animate-pulse',
                  state === 'speaking' && 'bg-emerald-500 animate-pulse',
                  state === 'idle' && 'bg-muted-foreground'
                )} />
                <span className="text-sm font-medium">AI Assistant</span>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-60 overflow-y-auto">
              {transcript && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">You said:</p>
                  <p className="text-sm text-foreground">{transcript}</p>
                </div>
              )}
              {response && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">AI Response:</p>
                  <p className="text-sm text-foreground">{response}</p>
                </div>
              )}
              {!transcript && !response && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {state === 'listening' ? 'Listening...' : 'Tap the orb to start speaking'}
                </p>
              )}
            </div>

            {/* Quick commands */}
            <div className="p-3 border-t border-border/50 bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-2">Try saying:</p>
              <div className="flex flex-wrap gap-1">
                {['Fleet status', 'Show alerts', 'Vehicle health'].map((cmd) => (
                  <span 
                    key={cmd}
                    className="px-2 py-1 text-xs bg-secondary/50 rounded-md text-muted-foreground"
                  >
                    "{cmd}"
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioOrb;
