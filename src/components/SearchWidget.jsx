import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Search } from 'lucide-react';
import StationAutocomplete from './StationAutocomplete';
import './SearchWidget.css';

export default function SearchWidget() {
  const { user } = useAuth();

  const [origin, setOrigin] = useState('New Delhi');
  const [destination, setDestination] = useState('Lucknow');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // Initialize from user's favourite journey if available
  useEffect(() => {
    if (user?.favouriteJourney) {
      if (user.favouriteJourney.origin) setOrigin(user.favouriteJourney.origin);
      if (user.favouriteJourney.destination) setDestination(user.favouriteJourney.destination);
    }
  }, [user]);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e) => {
    e.preventDefault();
    if (origin.toLowerCase().trim() === destination.toLowerCase().trim()) {
      setError('Origin and Destination stations cannot be the exact same.');
      return;
    }
    setError('');
    navigate(`/results?origin=${origin}&destination=${destination}&date=${date}`);
  };

  return (
    <div className="search-widget glass-panel">
      <form onSubmit={handleSearch} className="search-form">
        {error && <div className="search-error" style={{ width: '100%', color: '#ef4444', textAlign: 'center', marginBottom: '15px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', fontWeight: 'bold', gridColumn: '1 / -1' }}>{error}</div>}
        
        {/* Origin Field */}
        <div style={{ width: '100%', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</label>
          <StationAutocomplete 
            value={origin} 
            onChange={(val) => { setOrigin(val); setError(''); }} 
            placeholder="Origin Station" 
            iconColor="#2D9C6A" 
          />
        </div>
        
        <div className="divider"></div>

        {/* Destination Field */}
        <div style={{ width: '100%', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To</label>
          <StationAutocomplete 
            value={destination} 
            onChange={(val) => { setDestination(val); setError(''); }} 
            placeholder="Destination Station" 
            iconColor="#EF4444" 
          />
        </div>

        <div className="divider"></div>

        <div className="input-group">
          <Calendar className="input-icon" size={20} color="var(--text-secondary)" />
          <div className="input-field">
            <label htmlFor="search-date">Date</label>
            <input 
              id="search-date"
              type="date" 
              value={date} 
              min={today}
              onChange={(e) => setDate(e.target.value)} 
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary search-btn">
          <Search size={20} />
          Find Trains
        </button>
      </form>
    </div>
  );
}
