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
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[998]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[480px] pointer-events-auto"
            >
              {/* Modal Content */}
              <div className="relative">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 z-10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-3xl blur-2xl" />
                
                {/* Card */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Header with Logo */}
                  <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-b border-slate-700/50 px-8 py-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-white">FleetAI</h1>
                    </div>
                    <p className="text-center text-slate-400 text-sm">
                      {isLogin ? 'Sign in to access your dashboard' : 'Create your account'}
                    </p>
                  </div>

                  {/* Form */}
                  <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
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

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                              className="w-full h-12 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                                className="w-full h-12 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              />
                            </div>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                              <input
                                type="tel"
                                placeholder="Phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full h-12 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                          className="w-full h-12 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                          className="w-full h-12 pl-12 pr-14 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                          <label className="flex items-center gap-2 cursor-pointer group">
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
                            Forgot?
                          </button>
                        </div>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          isLogin ? 'Sign In' : 'Create Account'
                        )}
                      </Button>
                    </form>

                    {/* Toggle Login/Register */}
                    <div className="mt-6 text-center">
                      <p className="text-slate-400 text-sm">
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
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
