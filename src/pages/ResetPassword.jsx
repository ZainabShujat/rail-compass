import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel" style={{ padding: '60px 40px', maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={30} color="#3b82f6" />
          </div>
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Create New Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Your new password must be different from previous used passwords.
        </p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}
        {success && (
          <div style={{ color: '#10b981', marginBottom: '20px', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Password successfully reset! Redirecting to login...</span>
          </div>
        )}
        
        {!success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label>New Password</label>
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
      
      {/* Decorative background elements */}
      <div className="glow-orb orb-1" style={{ top: '20%', left: '10%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)' }}></div>
      <div className="glow-orb orb-2" style={{ bottom: '20%', right: '10%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)' }}></div>
    </div>
  );
}
