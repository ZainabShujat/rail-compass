import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle } from 'lucide-react';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await axios.post(`/api/auth/forgot-password`, { email });
      setMessage(res.data.message || 'If an account exists, a password reset link has been sent to your email.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel" style={{ padding: '60px 40px', maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={30} color="#3b82f6" />
          </div>
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}
        {message && (
          <div style={{ color: '#10b981', marginBottom: '20px', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{message}</span>
          </div>
        )}
        
        {!message && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="you@example.com" 
                className="auth-input" 
              />
            </div>
            
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        
        <div className="auth-footer" style={{ marginTop: '30px' }}>
          Remember your password? 
          <Link to="/login" className="auth-link">Back to Login</Link>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="glow-orb orb-1" style={{ top: '20%', left: '10%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)' }}></div>
      <div className="glow-orb orb-2" style={{ bottom: '20%', right: '10%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)' }}></div>
    </div>
  );
}
