import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit, ShieldCheck, Map } from 'lucide-react';
import SearchWidget from '../components/SearchWidget';
import FAQSection from '../components/FAQSection';
import './Home.css';

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [journeyDate, setJourneyDate] = useState('');
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const handleRouteClick = (origin, destination) => {
    setSelectedRoute({ origin, destination });
  };

  const handleRouteSubmit = (e) => {
    e.preventDefault();
    if (selectedRoute && journeyDate) {
      navigate(`/results?origin=${selectedRoute.origin}&destination=${selectedRoute.destination}&date=${journeyDate}`);
    }
  };
  return (
    <div className="home-container animate-fade-in" style={{ display: 'block' }}>
      <div className="hero-section" style={{ margin: '0 auto', paddingTop: '100px', paddingBottom: '100px', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="hero-content">
          <div className="badge">SMART & PERSONALIZED RECOMMENDATIONS</div>
          <h1>
            Find the <span className="accent-text">Perfect Train</span><br />
            for your Journey
          </h1>
          <p className="subtitle">
            RAIL COMPASS analyzes duration, daytime efficiency, budget, and reliability to recommend the best train tailored specifically to your needs.
          </p>
          
          <SearchWidget />
        </div>
      </div>
      
      <div className="features-section-wrapper full-page-section" id="features">
        <div className="features-section">
          <h2 className="section-title">Why use Rail Compass?</h2>
          <div className="features-grid ticket-layout">
            <div className="feature-card">
              <div className="feature-number mono-text step-label">STEP 01</div>
              <h3 className="feature-title">Smart Search</h3>
              <p className="feature-desc">Enter your journey details and we instantly scan thousands of routes and historical schedules across India.</p>
            </div>
            
            <div className="ticket-divider"></div>
            
            <div className="feature-card">
              <div className="feature-number mono-text step-label">STEP 02</div>
              <h3 className="feature-title">Smart Analysis</h3>
              <p className="feature-desc">Our intelligent algorithm weighs duration, daytime efficiency, budget, comfort, and reliability based on your unique needs.</p>
            </div>
            
            <div className="ticket-divider"></div>
            
            <div className="feature-card">
              <div className="feature-number mono-text step-label">STEP 03</div>
              <h3 className="feature-title">Precise Pricing</h3>
              <p className="feature-desc">We calculate realistic fares by dynamically factoring in distance, class bases, superfast surcharges, and catering fees.</p>
            </div>

            <div className="ticket-divider"></div>
            
            <div className="feature-card">
              <div className="feature-number mono-text step-label">STEP 04</div>
              <h3 className="feature-title">Top Recommendations</h3>
              <p className="feature-desc">Get clear, comprehensively ranked train options so you can always book the absolute perfect ticket for your journey.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="popular-routes-section-wrapper full-page-section" id="journeys">
        <div className="popular-routes-section">
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>Popular Journeys</h2>
        <div className="routes-grid">
          
          <div className="route-card" onClick={() => handleRouteClick('New Delhi', 'Lucknow')}>
            <img src="/lucknow.jpg" alt="Lucknow" className="route-image" />
            <div className="route-overlay">
              <div className="route-name">New Delhi <ArrowRight size={18} /> Lucknow</div>
              <button className="route-btn">Search Route</button>
            </div>
          </div>

          <div className="route-card" onClick={() => handleRouteClick('New Delhi', 'Mumbai')}>
            <img src="/mumbai.png" alt="Mumbai" className="route-image" />
            <div className="route-overlay">
              <div className="route-name">New Delhi <ArrowRight size={18} /> Mumbai</div>
              <button className="route-btn">Search Route</button>
            </div>
          </div>

          <div className="route-card" onClick={() => handleRouteClick('New Delhi', 'Jaipur')}>
            <img src="/jaipur.png" alt="Jaipur" className="route-image" />
            <div className="route-overlay">
              <div className="route-name">New Delhi <ArrowRight size={18} /> Jaipur</div>
              <button className="route-btn">Search Route</button>
            </div>
          </div>

          <div className="route-card" onClick={() => handleRouteClick('New Delhi', 'Kolkata')}>
            <img src="/kolkata.png" alt="Kolkata" className="route-image" />
            <div className="route-overlay">
              <div className="route-name">New Delhi <ArrowRight size={18} /> Kolkata</div>
              <button className="route-btn">Search Route</button>
            </div>
          </div>

          <div className="route-card" onClick={() => handleRouteClick('New Delhi', 'Allahabad')}>
            <img src="/allahabad.png" alt="Allahabad" className="route-image" />
            <div className="route-overlay">
              <div className="route-name">New Delhi <ArrowRight size={18} /> Allahabad</div>
              <button className="route-btn">Search Route</button>
            </div>
          </div>

          <div className="route-card" onClick={() => handleRouteClick('New Delhi', 'Hyderabad')}>
            <img src="/hyderabad.png" alt="Hyderabad" className="route-image" />
            <div className="route-overlay">
              <div className="route-name">New Delhi <ArrowRight size={18} /> Hyderabad</div>
              <button className="route-btn">Search Route</button>
            </div>
          </div>

        </div>
      </div>
      </div>

      <div className="guide-section-wrapper full-page-section" id="guide" style={{ padding: '60px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>Know Your Trains</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            <div className="glass-panel hover-lift" style={{ padding: '24px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Rajdhani (Raj)</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>Fully Air-Conditioned premium trains connecting New Delhi to major states. Prioritizes food, speed, and supreme comfort.</p>
            </div>
            
            <div className="glass-panel hover-lift" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Duronto (Drnt)</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>Vibrant yellow-green premium trains running point-to-point with very few commercial stops for ultra-fast travel.</p>
            </div>
            
            <div className="glass-panel hover-lift" style={{ padding: '24px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Shatabdi (Shtb)</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>Fast, day-time, fully-seated premium intercity trains bridging major business and tourism hubs.</p>
            </div>

            <div className="glass-panel hover-lift" style={{ padding: '24px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Garib Rath (GR)</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>Highly affordable, fully Air-Conditioned 3AC trains designed specifically for budget-conscious premium travel.</p>
            </div>

            <div className="glass-panel hover-lift" style={{ padding: '24px', borderLeft: '4px solid var(--accent-fill)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Superfast (SF)</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>The absolute backbone of Indian Railways. Covers long distances swiftly with a mix of Sleeper and AC classes.</p>
            </div>

            <div className="glass-panel hover-lift" style={{ padding: '24px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Jan Shatabdi (JShtb)</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>An affordable version of Shatabdi with both AC and Non-AC seating options for quick intercity commutes.</p>
            </div>

          </div>
        </div>
      </div>

      <div className="faq-section-wrapper full-page-section" id="faq">
        <FAQSection />
      </div>

      {/* Date Selection Modal */}
      {selectedRoute && createPortal(
        <div className="modal-overlay animate-fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', 
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '90%', position: 'relative' }}>
            <button 
              onClick={() => setSelectedRoute(null)} 
              style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>
            <h3 style={{ marginBottom: '1rem' }}>When are you travelling to {selectedRoute.destination}?</h3>
            <form onSubmit={handleRouteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label htmlFor="modal-date" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'white' }}>
                <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>Journey Date</span>
                <input 
                  id="modal-date"
                  type="date" 
                  aria-label="Journey Date"
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                min={today}
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                required
              />
              </label>
              <button type="submit" className="btn-primary" style={{ padding: '12px' }}>Find Trains</button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
