import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import './Auth.css';

export default function Signup({ setUserName }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    // Extract just the First Name
    const firstName = name.trim().split(' ')[0];
    
    // Mock signup logic - instantly log them in with their first name
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
        <h2>Create Account</h2>
        <p>Join Rail Compass to save your custom travel metrics.</p>
        
        <form onSubmit={handleSignup} className="auth-form">
          <div className="auth-input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="auth-input" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

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
            <UserPlus size={20} />
            Sign Up
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? 
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="glow-orb orb-1" style={{ top: '20%', right: '20%' }}></div>
      <div className="glow-orb orb-2" style={{ bottom: '20%', left: '10%' }}></div>
    </div>
  );
}
