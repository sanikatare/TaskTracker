import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Chrome, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const {
    loginWithEmail,
    loginWithGoogle,
    loginWithDev,
    devAuthEnabled,
    firebaseConfigured,
    useMongoAuth,
  } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch {
      /* handled in hook */
    }
  }

  async function handleDevLogin() {
    try {
      await loginWithDev();
      navigate('/');
    } catch {
      /* handled in hook */
    }
  }

  return (
    <div className="auth-shell">
      {/* Left Editorial Brand Panel */}
      <div className="auth-panel">
        <div>
          <div className="flex items-center gap-2.5 mb-14">
            <div className="w-8 h-8 rounded-lg bg-black border border-purple-900/60 flex items-center justify-center text-purple-400 font-bold text-sm">
              T
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              TaskTrack <span className="text-purple-400">AI</span>
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight text-white tracking-tight max-w-md">
            Structured academic planning for focused coursework.
          </h1>
          <p className="text-purple-200 text-sm sm:text-base max-w-md leading-relaxed mt-4">
            Organize assignments by deadline and priority, generate realistic daily study blocks, and track your semester progress without clutter.
          </p>
        </div>

        <div className="space-y-4 border-t border-purple-900/50 pt-8 text-xs text-purple-300">
          <div>01. Earliest-Deadline-First schedule optimization across your daily study windows</div>
          <div>02. Multi-phase study roadmaps with actionable daily milestones</div>
          <div>03. Quantitative tracking of completion rate and session hours</div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-black border border-purple-900/60 flex items-center justify-center text-purple-400 font-bold text-sm">
              T
            </div>
            <span className="text-base font-bold text-black">
              TaskTrack <span className="text-purple-700">AI</span>
            </span>
          </div>

          <div className="card p-7 sm:p-8 border border-purple-200 shadow-xl">
            <h2 className="text-xl font-bold text-black tracking-tight">Sign in to TaskTrack AI</h2>
            <p className="text-xs text-purple-900/70 mt-1 mb-6 font-medium">
              Enter your credentials or launch the student demo workspace
            </p>

            {devAuthEnabled && (
              <button
                onClick={handleDevLogin}
                type="button"
                className="btn-secondary w-full py-2.5 mb-5 font-semibold"
              >
                <Zap className="w-4 h-4 text-purple-700" />
                <span>Continue with Student Demo Workspace</span>
              </button>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">University Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || (!firebaseConfigured && !useMongoAuth)}
                className="btn-primary w-full py-2.5 font-bold"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {firebaseConfigured && (
              <>
                <div className="relative my-5">
                  <div className="divider-line" />
                </div>
                <button
                  onClick={handleGoogle}
                  type="button"
                  className="btn-ghost w-full"
                >
                  <Chrome className="w-4 h-4 text-purple-700" />
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            <p className="text-center text-xs text-purple-900/70 mt-6">
              New to TaskTrack AI?{' '}
              <Link
                to="/register"
                className="font-bold text-purple-700 hover:text-black inline-flex items-center gap-1"
              >
                Create an account <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
