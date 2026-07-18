import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function ParticleField() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 6 + 4,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'rgba(192, 132, 252, 0.3)',
            boxShadow: '0 0 6px rgba(192, 132, 252, 0.4)',
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function GridPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(rgba(192, 132, 252, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(192, 132, 252, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

function CircuitLines() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute w-full h-full opacity-[0.04]" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path d="M0 450 Q 360 300, 720 450 T 1440 450" fill="none" stroke="rgba(192, 132, 252, 0.5)" strokeWidth="1.5" />
        <path d="M0 600 Q 360 450, 720 600 T 1440 600" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1" />
        <path d="M0 300 Q 360 150, 720 300 T 1440 300" fill="none" stroke="rgba(124, 58, 237, 0.3)" strokeWidth="1" />
        <circle cx="720" cy="450" r="3" fill="rgba(192, 132, 252, 0.6)" />
        <circle cx="360" cy="300" r="2" fill="rgba(168, 85, 247, 0.5)" />
        <circle cx="1080" cy="600" r="2" fill="rgba(124, 58, 237, 0.5)" />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setShakeKey((k) => k + 1);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please try again.';
      setError(message);
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <ParticleField />
      <GridPattern />
      <CircuitLines />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-8 sm:p-10 glow-purple"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 mb-4 shadow-lg shadow-purple-500/10">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-gradient tracking-tight">
                English OS
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Sign in to continue your journey
              </p>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key={shakeKey}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, x: [0, -8, 8, -6, 6, -3, 3, 0] }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="input-premium pl-10"
                  autoComplete="email"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="input-premium pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="pt-2"
            >
              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full flex items-center justify-center gap-2 h-11 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.4; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
