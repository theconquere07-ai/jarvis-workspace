import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthPageProps {
  onAuth: () => void;
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { setError(null); setMsg(null); }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onAuth();
      } else {
        await signUp(email, password);
        setMsg('Check your email to confirm your account, then sign in.');
        setMode('signin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* HUD background */}
      <svg style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 900, opacity: 0.05, pointerEvents: 'none' }}>
        <circle className="hud-ring gold" cx="450" cy="450" r="200" />
        <circle className="hud-ring red"  cx="450" cy="450" r="280" />
        <circle className="hud-ring gold" cx="450" cy="450" r="360" />
      </svg>

      <div className="auth-box">
        <div className="auth-brand">JARVIS</div>
        <div className="auth-sub">Workspace / Yours</div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {msg && <div style={{ marginTop: 12, fontSize: 11, color: 'var(--gold)', textAlign: 'center' }}>{msg}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'signin' ? (
            <>Don't have an account?<button onClick={() => setMode('signup')}>Sign up</button></>
          ) : (
            <>Already have an account?<button onClick={() => setMode('signin')}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
