import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StationAutocomplete from '../components/StationAutocomplete';
import { User, MapPin, Settings, CheckCircle } from 'lucide-react';
import './Auth.css'; // Reusing for styling

export default function Profile() {
  const { user, updateProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Personal Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');

  // Favourite Journey
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  // Travel DNA
  const [weightDuration, setWeightDuration] = useState(0.35);
  const [weightDaytime, setWeightDaytime] = useState(0.25);
  const [weightBudget, setWeightBudget] = useState(0.20);
  const [weightReliability, setWeightReliability] = useState(0.10);
  const [weightComfort, setWeightComfort] = useState(0.05);
  const [weightFood, setWeightFood] = useState(0.05);
  const [preferredClass, setPreferredClass] = useState('All');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAge(user.age || '');
      setPhone(user.phone || '');

      if (user.favouriteJourney) {
        setOrigin(user.favouriteJourney.origin || '');
        setDestination(user.favouriteJourney.destination || '');
      }

      if (user.preferences) {
        setWeightDuration(user.preferences.weightDuration ?? 0.35);
        setWeightDaytime(user.preferences.weightDaytime ?? 0.25);
        setWeightBudget(user.preferences.weightBudget ?? 0.20);
        setWeightReliability(user.preferences.weightReliability ?? 0.10);
        setWeightComfort(user.preferences.weightComfort ?? 0.05);
        setWeightFood(user.preferences.weightFood ?? 0.05);
        setPreferredClass(user.preferences.preferredClass ?? 'All');
      }
    }
  }, [user, loading, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateProfile({
        name,
        age: age ? parseInt(age) : undefined,
        phone,
        favouriteJourney: { origin, destination },
        preferences: {
          weightDuration,
          weightDaytime,
          weightBudget,
          weightReliability,
          weightComfort,
          weightFood,
          preferredClass
        }
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <div className="page-container" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading...</div>;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        {user.picture ? (
          <img src={user.picture} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
        ) : (
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={30} color="white" />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>My Profile</h1>
          <p className="text-muted" style={{ margin: '5px 0 0 0' }}>Manage your details and travel preferences</p>
        </div>
      </div>

      {errorMsg && <div style={{ color: '#ef4444', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px' }}>{errorMsg}</div>}

      <form onSubmit={handleSave} style={{ display: 'grid', gap: '30px' }}>
        
        {/* Personal Details Section */}
        <section className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.4rem' }}><User size={24} /> Personal Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email (Read-only)</label>
              <input type="email" value={email} readOnly style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Age</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} min="1" max="120" style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
            </div>
          </div>
        </section>

        {/* Favourite Journey Section */}
        <section className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.4rem' }}><MapPin size={24} /> Favourite Journey (Optional)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>Set your most frequent route to auto-fill the search on the home page.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <StationAutocomplete 
                label="Origin Station/City"
                value={origin} 
                onChange={setOrigin} 
                placeholder="e.g. New Delhi" 
              />
            </div>
            <div style={{ position: 'relative' }}>
              <StationAutocomplete 
                label="Destination Station/City"
                value={destination} 
                onChange={setDestination} 
                placeholder="e.g. Mumbai" 
              />
            </div>
          </div>
        </section>

        {/* Travel DNA Section */}
        <section className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.4rem' }}><Settings size={24} /> Travel DNA Preferences</h2>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Preferred Class Filter</label>
            <select 
              value={preferredClass} 
              onChange={e => setPreferredClass(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem' }}
            >
              <option value="All">All Classes (Auto-Budgeting)</option>
              <option value="1AC">1AC (First AC)</option>
              <option value="2AC">2AC (Second AC)</option>
              <option value="3AC">3AC (Third AC)</option>
              <option value="3AE">3AE (AC Economy)</option>
              <option value="CC">CC (AC Chair Car)</option>
              <option value="EC">EC (Executive Chair Car)</option>
              <option value="SL">SL (Sleeper)</option>
              <option value="2S">2S (Second Seating)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label>Duration</label>
                <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightDuration * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={weightDuration} onChange={e => setWeightDuration(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label>Overnight Hours</label>
                <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightDaytime * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={weightDaytime} onChange={e => setWeightDaytime(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label>Budget</label>
                <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightBudget * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={weightBudget} onChange={e => setWeightBudget(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label>Reliability</label>
                <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightReliability * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={weightReliability} onChange={e => setWeightReliability(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label>Comfort</label>
                <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightComfort * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={weightComfort} onChange={e => setWeightComfort(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
          {successMsg && (
            <span className="animate-fade-in" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.95rem' }}>
              <CheckCircle size={18} /> {successMsg}
            </span>
          )}
          <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
