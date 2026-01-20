import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Truck,
  Cpu,
  Globe,
  Zap,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoginPage = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    department: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const result = await login({ email: formData.email, password: formData.password });
        if (!result.success) {
          setMessage({ type: 'error', text: result.message });
        }
      } else {
        const result = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          phone: formData.phone,
        });
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
          setTimeout(() => {
            setIsLogin(true);
            setMessage(null);
          }, 2000);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setFormData(prev => ({ ...prev, email, password }));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Left Side - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative z-10 flex-col justify-center px-12 xl:px-20">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">FleetAI</h1>
            <p className="text-slate-400 text-sm">Intelligent Fleet Management</p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="space-y-8 max-w-xl">
          <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1]">
            Smart Fleet
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Management
            </span>
          </h2>
          
          <p className="text-xl text-slate-400 leading-relaxed">
            Harness the power of AI for predictive maintenance, real-time monitoring, 
            and comprehensive fleet analytics.
          </p>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-6 pt-6">
            {[
              { icon: Cpu, label: 'ML Predictions', color: 'text-violet-400' },
              { icon: Globe, label: 'GPS Tracking', color: 'text-emerald-400' },
              { icon: LineChart, label: 'Analytics', color: 'text-blue-400' },
              { icon: Zap, label: 'Real-time Alerts', color: 'text-amber-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <item.icon className={cn("w-5 h-5", item.color)} />
                </div>
                <span className="text-slate-300 font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-10 pt-8 border-t border-slate-800">
            <div>
              <p className="text-4xl font-bold text-white">10K+</p>
              <p className="text-sm text-slate-500">Vehicles Tracked</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">99.9%</p>
              <p className="text-sm text-slate-500">Uptime</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">40%</p>
              <p className="text-sm text-slate-500">Cost Savings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-[440px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">FleetAI</h1>
          </div>

          {/* Form Container */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
            
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 sm:p-10 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-400">
                  {isLogin ? 'Sign in to access your dashboard' : 'Register to get started'}
                </p>
              </div>

              {/* Message Alert */}
              {message && (
                <div className={cn(
                  'flex items-center gap-3 p-4 rounded-xl mb-6',
                  message.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                )}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Registration Fields */}
                {!isLogin && (
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-12 sm:h-14 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required={!isLogin}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full h-12 sm:h-14 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full h-12 sm:h-14 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 sm:h-14 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-12 sm:h-14 pl-12 pr-14 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Remember Me & Forgot Password */}
                {isLogin && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        Remember me
                      </span>
                    </label>
                    <button 
                      type="button" 
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 text-base"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Toggle Login/Register */}
              <div className="mt-6 text-center">
                <p className="text-slate-400">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setMessage(null);
                    }}
                    className="text-blue-400 hover:text-blue-300 ml-2 font-medium transition-colors"
                  >
                    {isLogin ? 'Register' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-8">
            © 2024 FleetAI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
