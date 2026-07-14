import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

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

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel" style={{ padding: '60px 40px', maxWidth: '450px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Sign in to access your saved preferences and search history.</p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}
        
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
