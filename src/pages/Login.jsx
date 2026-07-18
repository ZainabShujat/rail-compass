import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Native Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);



  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`/api/auth/google`, {
        credential: credentialResponse.credential,
      });
      
      const { token, user } = res.data;
      login(token, user);
      
      if (!user.isOnboarded) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.message;
      setError(`Google Login Failed: ${serverMsg || err.message}`);
    }
  };

  const handleNativeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`/api/auth/login`, { email, password });
      const { token, user } = res.data;
      login(token, user);
      
      if (!user.isOnboarded) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 503) {
        setError('Database connection required for email login.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel" style={{ padding: '60px 40px', maxWidth: '450px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Sign in to access your saved preferences and search history.</p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}
        
        <form onSubmit={handleNativeSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="auth-input" />
          </div>
          <div className="auth-input-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                className="auth-input" 
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent-text)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ margin: '0 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google Login Failed');
            }}
            useOneTap
            theme="filled_blue"
            shape="rectangular"
            size="large"
            text="signin_with"
            width="100%"
          />
        </div>
        
        <div className="auth-footer" style={{ marginTop: '30px' }}>
          Don't have an account? 
          <Link to="/signup" className="auth-link">Create one</Link>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="glow-orb orb-1" style={{ top: '20%', left: '10%' }}></div>
      <div className="glow-orb orb-2" style={{ bottom: '20%', right: '10%' }}></div>
    </div>
  );
}
