import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';
import StationAutocomplete from '../components/StationAutocomplete';
import './Auth.css'; // Reuse some basic layout

export default function Onboarding() {
  const { user, updatePreferences, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [weightDuration, setWeightDuration] = useState(0.35);
  const [weightDaytime, setWeightDaytime] = useState(0.25);
  const [weightBudget, setWeightBudget] = useState(0.20);
  const [weightReliability, setWeightReliability] = useState(0.10);
  const [weightComfort, setWeightComfort] = useState(0.05);
  const [weightFood, setWeightFood] = useState(0.05);
  const [preferredClass, setPreferredClass] = useState('All');

  // Favourite Journey
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (updateProfile) {
        await updateProfile({
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
      } else {
        await updatePreferences({
          weightDuration,
          weightDaytime,
          weightBudget,
          weightReliability,
          weightComfort,
          weightFood,
          preferredClass
        });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // If already onboarded, don't force them to be here
  if (user && user.isOnboarded) {
    navigate('/');
    return null;
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '700px', padding: '60px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Set Your Travel DNA</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>
          Tell us what matters most to you. We'll use this to tailor your train recommendations every time you search.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '40px' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>Preferred Class Filter</label>
          <select 
            value={preferredClass} 
            onChange={e => setPreferredClass(e.target.value)}
            style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '1rem' }}
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

        <h3 style={{ fontSize: '1.25rem', marginTop: '30px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Favourite Journey (Optional)</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>Set your most frequent route to auto-fill the search.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <StationAutocomplete 
              label="From (Origin)"
              value={origin} 
              onChange={setOrigin} 
              placeholder="e.g. New Delhi" 
            />
          </div>
          <div style={{ position: 'relative' }}>
            <StationAutocomplete 
              label="To (Destination)"
              value={destination} 
              onChange={setDestination} 
              placeholder="e.g. Mumbai" 
            />
          </div>
        </div>

        <h3 style={{ fontSize: '1.25rem', marginTop: '30px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Algorithm Weights</h3>

        <div style={{ display: 'grid', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500' }}>Duration</label>
              <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightDuration * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={weightDuration} onChange={e => setWeightDuration(parseFloat(e.target.value))} style={{ width: '100%' }} />
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Prioritizes the fastest trains.</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500' }}>Overnight Hours</label>
              <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightDaytime * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={weightDaytime} onChange={e => setWeightDaytime(parseFloat(e.target.value))} style={{ width: '100%' }} />
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Rewards night trains to save your daytime.</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500' }}>Budget</label>
              <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightBudget * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={weightBudget} onChange={e => setWeightBudget(parseFloat(e.target.value))} style={{ width: '100%' }} />
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Evaluates ticket fare against the overall journey value.</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500' }}>Reliability</label>
              <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightReliability * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={weightReliability} onChange={e => setWeightReliability(parseFloat(e.target.value))} style={{ width: '100%' }} />
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Considers historical on-time performance.</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500' }}>Comfort</label>
              <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightComfort * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={weightComfort} onChange={e => setWeightComfort(parseFloat(e.target.value))} style={{ width: '100%' }} />
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Factors in coach quality and passenger reviews.</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500' }}>Food Quality</label>
              <span style={{ color: 'var(--accent-text)' }}>{Math.round(weightFood * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={weightFood} onChange={e => setWeightFood(parseFloat(e.target.value))} style={{ width: '100%' }} />
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Rates the availability and standard of pantry services.</p>
          </div>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
            {loading ? 'Saving...' : (
              <>
                <CheckCircle size={20} style={{ marginRight: '8px' }} />
                Save My Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
