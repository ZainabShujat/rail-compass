import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import './Auth.css';

export default function Login({ setUserName }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Extract name from email and capitalize the first letter
    const emailPrefix = email.split('@')[0];
    const firstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    
    try {
      localStorage.setItem('userName', firstName);
    } catch (e) {
      console.warn('localStorage access denied');
    }
    if (setUserName) setUserName(firstName);
    
    navigate('/');
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel">
        <h2>Welcome Back</h2>
        <p>Sign in to access your saved preferences.</p>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="auth-input" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="auth-input-group">
            <label>Password</label>
            <input 
              type="password" 
              className="auth-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary auth-button">
            <LogIn size={20} />
            Sign In
          </button>
        </form>
        
        <div className="auth-footer">
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
