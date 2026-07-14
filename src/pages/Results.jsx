import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import TrainCard from '../components/TrainCard';
import { useAuth } from '../context/AuthContext';
import './Results.css';

const RAILWAY_FACTS = [
  "The Lucknow-New Delhi AC Superfast was originally a Rajdhani Express, but was downgraded because the route was too short for a mandatory pantry car.",
  "If you visit the Navapur Railway Station, you can literally stand with one foot in Maharashtra and the other in Gujarat. The state border runs directly through the middle of the station.",
  "The Chenab Bridge in Jammu & Kashmir is the world's highest rail bridge, towering 359 meters above the river—taller than the Eiffel Tower!",
  "India's slowest train, the Mettupalayam-Ooty Nilgiri Passenger, chugs along at a leisurely 10 km/h—so slow you can easily run alongside it.",
  "The Howrah-Amritsar Express holds the record for the most stops on a single route, halting at an exhausting 115 stations.",
  "Indian Railways' official mascot is 'Bholu', a friendly elephant dressed as a railway guard holding a green signal lamp.",
  "The Vivek Express travels a grueling 4,234 km over 82 hours without changing trains, making it the longest rail route in India.",
  "Gorakhpur Railway Station in Uttar Pradesh boasts the world's longest railway platform, stretching over 1.3 kilometers.",
  "The majestic Pir Panjal Railway Tunnel in the Himalayas is 11.2 km long—India's longest transportation tunnel."
];

function LoadingFacts() {
  const [factIndex, setFactIndex] = useState(0);

  const nextFact = () => {
    setFactIndex((prev) => (prev + 1) % RAILWAY_FACTS.length);
  };

  return (
    <div className="glass-panel loading-facts animate-fade-in" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <Loader2 className="spinner" size={48} style={{ color: 'var(--accent-fill)' }} />
      <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', lineHeight: '1.4' }}>
        We'll have your perfect journey ready in just a moment... <br/>
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'normal' }}>Meanwhile, did you know?</span>
      </h3>
      
      <div style={{ padding: '1.5rem', background: 'color-mix(in srgb, var(--accent-fill) 10%, transparent)', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '120px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.5, color: 'var(--accent-text)' }}>"{RAILWAY_FACTS[factIndex]}"</p>
      </div>
      
      <button onClick={nextFact} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderColor: 'var(--border-strong)' }}>
        Another fact?
      </button>
    </div>
  );
}


export default function Results() {
  const [searchParams] = useSearchParams();
  const origin = searchParams.get('origin') || 'New Delhi';
  const destination = searchParams.get('destination') || 'Lucknow';
  const date = searchParams.get('date');
  const { user } = useAuth();

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);

  // Weights state
  const [weightDuration, setWeightDuration] = useState(0.35);
  const [weightDaytime, setWeightDaytime] = useState(0.25);
  const [weightBudget, setWeightBudget] = useState(0.20);
  const [weightReliability, setWeightReliability] = useState(0.10);
  const [weightComfort, setWeightComfort] = useState(0.05);
  const [weightFood, setWeightFood] = useState(0.05);
  const [preferredClass, setPreferredClass] = useState('All');

  // Load user preferences once on mount if available
  useEffect(() => {
    if (user && user.preferences) {
      setWeightDuration(user.preferences.weightDuration ?? 0.35);
      setWeightDaytime(user.preferences.weightDaytime ?? 0.25);
      setWeightBudget(user.preferences.weightBudget ?? 0.20);
      setWeightReliability(user.preferences.weightReliability ?? 0.10);
      setWeightComfort(user.preferences.weightComfort ?? 0.05);
      setWeightFood(user.preferences.weightFood ?? 0.05);
      setPreferredClass(user.preferences.preferredClass ?? 'All');
    }
  }, [user]);

  useEffect(() => {
    const fetchTrains = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          origin,
          destination,
          date: date || '',
          weightDuration,
          weightDaytime,
          weightBudget,
          weightReliability,
          weightComfort,
          weightFood,
          preferredClass
        });

        // Simulate Analyzing delay for the wow factor
        setTimeout(async () => {
          // In production (Vercel), we use relative paths so it hits the serverless backend. Locally, we hit localhost:5000.
          const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';
          const res = await axios.get(`${API_URL}/api/trains?${queryParams}`);
          setTrains(res.data);
          setLoading(false);
        }, 4000);
      } catch (error) {
        console.error('Error fetching trains:', error);
        setLoading(false);
      }
    };

    fetchTrains();
  }, [origin, destination, date, weightDuration, weightDaytime, weightBudget, weightReliability, weightComfort, weightFood, preferredClass]);

  return (
    <>
      <div className="page-container animate-fade-in" style={{ background: 'transparent' }}>
      <div className="results-header">
        <div>
          <h2 className="route-title">{origin} to {destination}</h2>
          <p className="route-date">{date || 'Any Date'} • {trains.length} trains found</p>
        </div>
        
        <button className="btn-secondary filter-btn">
          <SlidersHorizontal size={18} />
          RailPilot Settings
        </button>
      </div>

      {/* Weather Banner */}
      <div className="weather-banner glass-panel" style={{ margin: '0 0 2rem 0', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'color-mix(in srgb, var(--accent-fill) 5%, transparent)' }}>
        <span style={{ fontSize: '1.5rem' }}>🌤️</span>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Expected Weather in {destination}</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>28°C, Partly Cloudy. Pack light!</p>
        </div>
      </div>

      <div className="results-layout">
        <aside className="filters-sidebar glass-panel">
          <h3>Advanced Preferences</h3>
          <p className="text-muted text-sm mb-4">Customize the RailPilot algorithm weights.</p>
          
          <div className="class-selector mb-4">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Preferred Class Filter</label>
            <select 
              value={preferredClass} 
              onChange={e => setPreferredClass(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
            >
              <option value="All" style={{ color: '#000' }}>All Classes (Auto-Budgeting)</option>
              <option value="1AC" style={{ color: '#000' }}>1AC (First AC)</option>
              <option value="2AC" style={{ color: '#000' }}>2AC (Second AC)</option>
              <option value="3AC" style={{ color: '#000' }}>3AC (Third AC)</option>
              <option value="3AE" style={{ color: '#000' }}>3AE (AC Economy)</option>
              <option value="CC" style={{ color: '#000' }}>CC (AC Chair Car)</option>
              <option value="EC" style={{ color: '#000' }}>EC (Executive Chair Car)</option>
              <option value="SL" style={{ color: '#000' }}>SL (Sleeper)</option>
              <option value="2S" style={{ color: '#000' }}>2S (Second Seating)</option>
            </select>
          </div>
          
          <div className="weight-slider mt-4">
            <label>Duration ({Math.round(weightDuration * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Prioritizes trains that offer the shortest overall travel time.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightDuration} onChange={e => setWeightDuration(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Overnight Hours ({Math.round(weightDaytime * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Rewards trains that travel during the night to save your daytime for productivity.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightDaytime} onChange={e => setWeightDaytime(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Budget ({Math.round(weightBudget * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Evaluates the ticket fare against the overall journey value.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightBudget} onChange={e => setWeightBudget(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Reliability ({Math.round(weightReliability * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Considers historical on-time departures and arrivals.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightReliability} onChange={e => setWeightReliability(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Comfort ({Math.round(weightComfort * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Factors in coach quality, seating, and passenger reviews.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightComfort} onChange={e => setWeightComfort(parseFloat(e.target.value))} />
          </div>
          <div className="weight-slider">
            <label>Food Quality ({Math.round(weightFood * 100)}%)</label>
            <p className="text-muted text-xs mb-2" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>Rates the availability and standard of pantry services.</p>
            <input type="range" min="0" max="1" step="0.05" value={weightFood} onChange={e => setWeightFood(parseFloat(e.target.value))} />
          </div>
        </aside>

        <div className="trains-list">
          {loading ? (
            <LoadingFacts />
          ) : (
            <>
              {trains.map((train, index) => (
                <TrainCard key={train._id} train={train} rank={index + 1} preferredClass={preferredClass} />
              ))}
              {trains.length === 0 && (
                <div className="glass-panel empty-state">
                  <h3>No trains found</h3>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
