import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../services/firebase';

export default function MacAuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Bloc</h1>
        <p style={styles.tagline}>Deep work, tracked.</p>
        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <button style={styles.toggle} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#0D1117',
  },
  card: {
    width: 360,
    padding: 40,
    background: '#161B22',
    borderRadius: 20,
    border: '1px solid #21262D',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  logo: { fontSize: 42, fontWeight: 900, color: '#E6EDF3', margin: 0 },
  tagline: { fontSize: 14, color: '#7D8590', margin: 0 },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 10 },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    background: '#0D1117',
    border: '1px solid #21262D',
    color: '#E6EDF3',
    fontSize: 15,
    outline: 'none',
  },
  btn: {
    padding: '13px',
    borderRadius: 10,
    background: '#2E9BB5',
    border: 'none',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  toggle: {
    background: 'none',
    border: 'none',
    color: '#7D8590',
    fontSize: 13,
    cursor: 'pointer',
    padding: 4,
  },
  error: { color: '#EF4444', fontSize: 13, margin: 0 },
};
