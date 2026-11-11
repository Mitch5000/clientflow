import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const features = [
    'Unlimited projects',
    'Real-time collaboration',
    'Cloud sync across devices',
    'Keyboard shortcuts',
  ];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-deep/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-deep/10 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card border border-line rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-black/25 border border-line">
              <Logo size={22} />
            </div>
            <span className="text-xl font-bold text-ink tracking-tight">Clientflow</span>
          </div>

          <h2 className="text-2xl font-bold text-ink text-center mb-2">Create your account</h2>
          <p className="text-muted text-center text-sm mb-8">Start managing your projects like a pro</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-xl bg-rust/10 border border-rust/20 text-rust-light text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-fill border border-line rounded-xl text-ink-dim placeholder-faint text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-plum/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-fill border border-line rounded-xl text-ink-dim placeholder-faint text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-plum/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 bg-fill border border-line rounded-xl text-ink-dim placeholder-faint text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-plum/10 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:bg-accent-light text-ink font-medium rounded-xl transition-all shadow-lg shadow-black/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-plum-light hover:text-plum-lighter font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-line">
            <div className="grid grid-cols-2 gap-3">
              {features.map(feature => (
                <div key={feature} className="flex items-center gap-2 text-xs text-faint">
                  <CheckCircle2 className="w-3.5 h-3.5 text-moss" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
