// src/pages/login.tsx - FIXED: Auto-redirect if already logged in
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api, { setAuthToken } from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading, user } = useAuth();

  // ✅ FIX: Redirect to home if already authenticated
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting...');
      
      // Redirect based on role
      if (user?.role === 'DELIVERY_AGENT') {
        router.push('/agent/dashboard');
      } else if (user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      const { user, token } = res.data;
      
      setAuthToken(token);
      login(user, token);
      
      // Redirect based on role
      if (user.role === 'DELIVERY_AGENT') {
        router.push('/agent/dashboard');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div style={{ 
        maxWidth: '1100px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        alignItems: 'center',
        minHeight: 'calc(100vh - 300px)'
      }}>
        {/* Left Side - Illustration */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '600px',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '2rem', textAlign: 'center' }}>📚</div>
          <h2 style={{ 
            color: 'white', 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Welcome Back!
          </h2>
          <p style={{ 
            fontSize: '1.125rem',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            lineHeight: 1.8
          }}>
            Continue your journey in our book-sharing community. Discover new reads, connect with fellow book lovers.
          </p>
          
          <div style={{ 
            marginTop: '3rem',
            padding: '2rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>
              ✨ Why BookShare?
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <Feature>📖 Access thousands of books</Feature>
              <Feature>🚚 Door-to-door delivery</Feature>
              <Feature>🤝 Build community connections</Feature>
              <Feature>🌍 Promote sustainable reading</Feature>
            </ul>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div>
          <div className="card" style={{ padding: '3rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Sign In</h1>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              Enter your credentials to access your account
            </p>

            {error && (
              <div className="alert alert-error">
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="input"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ 
                      width: '20px', 
                      height: '20px',
                      borderWidth: '2px' 
                    }}></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div style={{
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--gray-200)'
            }}>
              <p style={{ 
                textAlign: 'center', 
                color: 'var(--gray-600)',
                marginBottom: '1rem'
              }}>
                Don't have an account?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a 
                  href="/register"
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                  <span>📚</span>
                  <span>Register as User</span>
                </a>
                
                <a 
                  href="/register-agent"
                  className="btn btn-outline"
                  style={{ 
                    width: '100%',
                    borderColor: 'var(--secondary)',
                    color: 'var(--secondary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--secondary)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = 'var(--secondary)';
                  }}
                >
                  <span>🚚</span>
                  <span>Register as Delivery Agent</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ 
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: 'white',
      fontSize: '0.9375rem'
    }}>
      {children}
    </li>
  );
}