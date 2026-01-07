import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    MapPin,
    Mic,
    Zap,
    Activity,
    Brain,
    Shield,
    BarChart3,
    Truck,
    ChevronDown,
    ArrowRight,
    CheckCircle,
    Star,
    Globe,
    Clock,
    Play,
    Users,
    TrendingUp,
    Award,
    ChevronLeft,
    ChevronRight,
    Menu,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import AudioOrb from '@/components/voice/AudioOrb';

// Animated background grid
const GridBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(99,102,241,0.15),transparent)]"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity }}
        />
    </div>
);

// Floating particles
const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    background: `hsl(${220 + Math.random() * 60}, 80%, ${60 + Math.random() * 20}%)`,
                }}
                animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.6, 0.2],
                    scale: [1, 1.5, 1],
                }}
                transition={{
                    duration: 3 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                }}
            />
        ))}
    </div>
);

// Animated counter
const AnimatedNumber = ({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [isInView, value]);

    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// Feature card with 3D tilt
const FeatureCard = ({ feature, index }: { feature: any; index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        setRotateX((y - centerY) / 20);
        setRotateY((centerX - x) / 20);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative group perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: 'transform 0.1s ease-out',
            }}
        >
            <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/50 border border-white/10 backdrop-blur-sm overflow-hidden group-hover:border-white/20 transition-all duration-300">
                {/* Glow effect */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${feature.glow}15, transparent 40%)`,
                    }}
                />

                {/* Animated border gradient */}
                <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100"
                    style={{
                        background: `linear-gradient(135deg, ${feature.glow}20, transparent 50%, ${feature.glow}20)`,
                    }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />

                {/* Icon */}
                <motion.div
                    className={cn(
                        "relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl",
                        `bg-gradient-to-br ${feature.gradient}`
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    <feature.icon className="w-8 h-8 text-white" />
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                <p className="text-slate-400 relative z-10 leading-relaxed mb-6">{feature.description}</p>

                <motion.div
                    className="flex items-center text-sm font-medium text-white/70 group-hover:text-white relative z-10"
                    whileHover={{ x: 5 }}
                >
                    Learn more <ArrowRight className="w-4 h-4 ml-2" />
                </motion.div>
            </div>
        </motion.div>
    );
};

// Testimonial carousel
const TestimonialCarousel = ({ testimonials }: { testimonials: any[] }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    return (
        <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <div className="relative inline-block mb-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/25">
                            {testimonials[current].author.charAt(0)}
                        </div>
                        <motion.div
                            className="absolute -inset-2 rounded-full border-2 border-indigo-500/30"
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <blockquote className="text-2xl md:text-3xl text-white font-light leading-relaxed mb-8">
                        "{testimonials[current].quote}"
                    </blockquote>
                    <div>
                        <p className="font-semibold text-white text-lg">{testimonials[current].author}</p>
                        <p className="text-slate-400">{testimonials[current].role}</p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation dots */}
            <div className="flex justify-center gap-2 mt-10">
                {testimonials.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            i === current ? "w-8 bg-indigo-500" : "bg-slate-600 hover:bg-slate-500"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

// Navigation
const Navigation = ({ onLogin }: { onLogin: () => void }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled ? "bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-xl" : ""
            )}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <motion.div 
                    className="flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">Fleet Guardian</span>
                </motion.div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'Pricing', 'About', 'Contact'].map((item) => (
                        <motion.a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-slate-300 hover:text-white transition-colors font-medium"
                            whileHover={{ y: -2 }}
                        >
                            {item}
                        </motion.a>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        className="text-white hover:bg-white/10"
                        onClick={onLogin}
                    >
                        Sign In
                    </Button>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25"
                            onClick={onLogin}
                        >
                            Start Free Trial
                        </Button>
                    </motion.div>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
                    >
                        <div className="p-6 space-y-4">
                            {['Features', 'Pricing', 'About', 'Contact'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="block text-slate-300 hover:text-white py-2 font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <Button 
                                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600"
                                onClick={() => { onLogin(); setIsMobileMenuOpen(false); }}
                            >
                                Start Free Trial
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

interface LandingPageProps {
    onNavigateToLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
    const { scrollYProgress } = useScroll();
    const heroRef = useRef<HTMLDivElement>(null);
    const isHeroInView = useInView(heroRef, { once: true });
    
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

    const handleLogin = () => {
        if (onNavigateToLogin) {
            onNavigateToLogin();
        } else {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'login' } }));
        }
    };

    const features = [
        {
            icon: Brain,
            title: 'Predictive Maintenance AI',
            description: 'Our ML models analyze sensor data to predict failures 2 weeks in advance, reducing downtime by 73%.',
            gradient: 'from-purple-500 to-pink-500',
            glow: '#d8b4fe'
        },
        {
            icon: MapPin,
            title: 'Real-time GPS Tracking',
            description: 'Track every vehicle with sub-meter accuracy. Live updates every 3 seconds with offline support.',
            gradient: 'from-cyan-500 to-blue-500',
            glow: '#67e8f9'
        },
        {
            icon: Mic,
            title: 'Voice AI Assistant',
            description: 'Ask anything naturally. Get instant fleet insights powered by advanced language models.',
            gradient: 'from-green-500 to-emerald-500',
            glow: '#86efac'
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            description: 'Deep insights into fuel efficiency, driver behavior, and route optimization with actionable recommendations.',
            gradient: 'from-orange-500 to-red-500',
            glow: '#fdba74'
        },
        {
            icon: Shield,
            title: 'Enterprise Security',
            description: 'SOC 2 Type II certified with end-to-end encryption, SSO, and granular role-based access control.',
            gradient: 'from-blue-500 to-indigo-500',
            glow: '#93c5fd'
        },
        {
            icon: Globe,
            title: 'Global Coverage',
            description: 'Works in 180+ countries with local compliance. Offline-first architecture ensures 99.99% uptime.',
            gradient: 'from-teal-500 to-cyan-500',
            glow: '#5eead4'
        },
    ];

    const stats = [
        { value: 99.9, suffix: '%', label: 'Uptime SLA', icon: Activity, color: 'from-cyan-500 to-blue-500' },
        { value: 50, suffix: 'K+', label: 'Vehicles Tracked', icon: Truck, color: 'from-purple-500 to-pink-500' },
        { value: 73, suffix: '%', label: 'Less Downtime', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
        { value: 150, suffix: 'ms', label: 'AI Response', icon: Zap, color: 'from-orange-500 to-amber-500' },
    ];

    const testimonials = [
        {
            quote: "Fleet Guardian reduced our maintenance costs by 40% in the first quarter. The AI predictions are incredibly accurate.",
            author: "Sarah Chen",
            role: "VP of Operations, LogiCorp International",
        },
        {
            quote: "We've had zero unexpected breakdowns since implementing Fleet Guardian. It's transformed our fleet operations.",
            author: "Michael Rodriguez",
            role: "Fleet Director, FastFreight LLC",
        },
        {
            quote: "The voice assistant is a game-changer for our drivers. They can get information hands-free while on the road.",
            author: "Emily Watson",
            role: "CEO, GreenTransport Co",
        },
    ];

    const trustedBy = [
        'LogiCorp', 'FastFreight', 'GreenTransport', 'MetroFleet', 'PrimeLogistics', 'TransitPro'
    ];

    return (
        <div className="relative min-h-screen bg-slate-950 overflow-hidden">
            <GridBackground />
            <FloatingParticles />

            {/* Navigation */}
            <Navigation onLogin={handleLogin} />

            {/* Hero Section */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
                {/* Gradient orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-[120px]"
                    style={{ y: backgroundY }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-[100px]"
                    style={{ y: backgroundY }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />

                <motion.div
                    style={{ opacity }}
                    className="relative z-10 text-center px-6 max-w-6xl mx-auto"
                >
                    {/* Announcement badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Announcing Fleet Guardian 3.0 with Voice AI</span>
                        <ArrowRight className="w-4 h-4" />
                    </motion.div>

                    {/* Main headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8"
                    >
                        <span className="text-white">The Future of</span>
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Fleet Intelligence
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        AI-powered fleet management that predicts failures before they happen. 
                        Real-time tracking, voice commands, and actionable insights.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="flex flex-wrap items-center justify-center gap-4 mb-16"
                    >
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                size="lg"
                                className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/20"
                                onClick={handleLogin}
                            >
                                <Play className="w-5 h-5 mr-2 fill-current" />
                                Start Free Trial
                            </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                size="lg"
                                variant="outline"
                                className="h-14 px-8 text-lg border-white/20 hover:bg-white/10 text-white group"
                            >
                                <span className="mr-2">Try Voice Demo</span>
                                <AudioOrb size="sm" />
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={isHeroInView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.7 }}
                        className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-500" />
                            <span>SOC 2 Type II certified</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span>5-minute setup</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <ChevronDown className="w-8 h-8 text-slate-500" />
                </motion.div>
            </section>

            {/* Trusted By Section */}
            <section className="relative py-16 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-sm text-slate-500 mb-8 uppercase tracking-wider">Trusted by industry leaders</p>
                    <div className="flex flex-wrap items-center justify-center gap-12">
                        {trustedBy.map((company, i) => (
                            <motion.div
                                key={company}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="text-xl font-bold text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                            >
                                {company}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative text-center group"
                            >
                                <motion.div
                                    className={cn(
                                        "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl",
                                        stat.color
                                    )}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                >
                                    <stat.icon className="w-8 h-8 text-white" />
                                </motion.div>
                                <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                                </p>
                                <p className="text-slate-400">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-center mb-20"
                    >
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Powerful Features
                        </span>
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Everything you need to
                            <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                manage your fleet
                            </span>
                        </h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Enterprise-grade tools designed for modern fleet operations
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} feature={feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="relative py-32 bg-gradient-to-b from-slate-900/50 to-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="flex items-center justify-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                            ))}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Loved by 500+ Companies
                        </h2>
                        <p className="text-xl text-slate-400">
                            See what our customers are saying
                        </p>
                    </motion.div>

                    <TestimonialCarousel testimonials={testimonials} />
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                        className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-[100px]"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                        transition={{ duration: 20, repeat: Infinity }}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="relative z-10 max-w-4xl mx-auto px-6 text-center"
                >
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-8"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Award className="w-4 h-4" />
                        <span>Limited Time: 3 Months Free on Annual Plans</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Ready to Transform
                        <br />
                        Your Fleet Operations?
                    </h2>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Join thousands of companies reducing costs and preventing breakdowns with AI-powered fleet intelligence.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                size="lg"
                                className="h-16 px-10 text-lg bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/20"
                                onClick={handleLogin}
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                size="lg"
                                variant="outline"
                                className="h-16 px-10 text-lg border-white/20 hover:bg-white/10 text-white"
                            >
                                <Users className="w-5 h-5 mr-2" />
                                Schedule Demo
                            </Button>
                        </motion.div>
                    </div>

                    <p className="text-slate-500 text-sm mt-8">
                        No credit card required • Free 14-day trial • Cancel anytime
                    </p>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative py-16 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">Fleet Guardian</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-8 text-sm text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Documentation</a>
                            <a href="#" className="hover:text-white transition-colors">Support</a>
                        </div>

                        <p className="text-slate-500 text-sm">
                            © 2026 Fleet Guardian AI. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
