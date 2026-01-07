import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, Mic, Zap, Activity, Brain } from 'lucide-react';

const LuminaHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Aurora Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-500/30 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl animate-pulse" />
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="grid-fade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="grid-mask">
              <rect width="100%" height="100%" fill="url(#grid-fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" mask="url(#grid-mask)" />
        </svg>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-medium animate-pulse-scale">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Fleet Intelligence
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium">
            <Zap className="w-3.5 h-3.5" />
            Real-time ML Predictions
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
          <span className="block text-white">Fleet Guardian</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-gradient">
            Intelligent Operations
          </span>
        </h1>

        <p className="text-slate-300 max-w-2xl mb-8 text-lg leading-relaxed">
          Real-time GPS tracking, predictive maintenance AI, and voice-enabled fleet management.
          Built for <span className="text-cyan-400 font-medium">production-ready</span> commercial transport.
        </p>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-xs text-slate-400">Uptime</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">5+</p>
              <p className="text-xs text-slate-400">ML Models</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/20">
              <Zap className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">&lt;300ms</p>
              <p className="text-xs text-slate-400">AI Response</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5">
            <MapPin className="w-4 h-4 mr-2" />
            View Live Fleet
          </Button>
          <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300">
            <Mic className="w-4 h-4 mr-2" />
            Try Voice Assistant
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LuminaHero;
