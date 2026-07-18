import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Native Auth State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/google`, {
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
      setError('Failed to authenticate with Google. Please try again.');
    }
  };

  const handleNativeSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
      const { token, user } = res.data;
      login(token, user);
      navigate('/onboarding');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 503) {
        setError('Database connection required for email registration.');
      } else {
        setError(err.response?.data?.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel" style={{ padding: '60px 40px', maxWidth: '450px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Join Rail Compass</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Create an account to personalize your travel recommendations.</p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}
        
        <form onSubmit={handleNativeSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Zaheer Hasan" className="auth-input" />
          </div>
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
                minLength="6" 
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
          </div>
          <div className="auth-input-group">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                minLength="6" 
                placeholder="••••••••" 
                className="auth-input" 
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
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
              setError('Google Signup Failed');
            }}
            useOneTap
            theme="filled_blue"
            shape="rectangular"
            size="large"
            text="signup_with"
            width="100%"
          />
        </div>
        
        <div className="auth-footer" style={{ marginTop: '30px' }}>
          Already have an account? 
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="glow-orb orb-1" style={{ top: '20%', right: '20%' }}></div>
      <div className="glow-orb orb-2" style={{ bottom: '20%', left: '10%' }}></div>
    </div>
  );
}
