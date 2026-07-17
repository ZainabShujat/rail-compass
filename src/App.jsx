import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Train, Sun, Moon, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
};

import Home from './pages/Home';
import Results from './pages/Results';
import Login from './pages/Login';
import Signup from './pages/Signup';
import About from './pages/About';
import PremiumInsights from './pages/PremiumInsights';
import ContactUs from './pages/ContactUs';
import Support from './pages/Support';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Footer from './components/Footer';
import './index.css';

// Placeholder components for 7-step journey (Weeks 1-2 UI structure)
const TrainDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 4: Train Details</h2><p>Compare amenities and metrics.</p></div>;
const ClassSelection = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 5: Class/Seat Selection</h2><p>Choose Sleeper, 3AC, etc.</p></div>;
const PassengerDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 6: Passenger Details</h2><p>Enter traveler info.</p></div>;
const BookingConfirmation = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 7: Booking Confirmation</h2><p>Your ticket is booked!</p></div>;

function Navigation() {
  const [theme, setTheme] = useState('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="app-header">
      <Link to="/" className="logo">
        <img src="/logo.png" alt="Rail Compass Logo" style={{ width: '80px', height: 'auto', marginRight: '12px' }} />
        <span className="logo-text"><span className="logo-rail">RAIL</span> <span className="logo-compass">COMPASS</span></span>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link to="/" className="nav-link">Home</Link>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/profile" style={{ fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                {user.picture ? <img src={user.picture} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} /> : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: '12px' }}>{user.name.charAt(0)}</span></div>}
                Welcome, {user.name.split(' ')[0]}
              </Link>
              <button onClick={logout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Log out</button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 16px' }}>Sign In</Link>
          )}
        </nav>
        
        {/* Hamburger Icon */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMenuOpen(true)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Side Drawer */}
      {isMenuOpen && (
        <>
          <div 
            className="drawer-overlay animate-fade-in" 
            onClick={() => setIsMenuOpen(false)} 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, backdropFilter: 'blur(2px)' }} 
          />
          <div 
            className="side-drawer" 
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '300px', background: 'var(--bg-secondary)', zIndex: 10001, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '-5px 0 30px rgba(0,0,0,0.5)', borderLeft: '1px solid var(--border-color)', animation: 'slideInRight 0.3s ease forwards' }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><X size={28} /></button>
            </div>
            
            <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '1.2rem', color: 'var(--text-main)', textDecoration: 'none', padding: '15px 0', borderBottom: '1px solid var(--border-color)', fontWeight: '500' }}>Home</Link>
            
            {user ? (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '1.2rem', color: 'var(--text-main)', textDecoration: 'none', padding: '15px 0', borderBottom: '1px solid var(--border-color)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {user.picture ? <img src={user.picture} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: '14px' }}>{user.name.charAt(0)}</span></div>}
                  My Profile
                </Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} style={{ fontSize: '1.2rem', color: '#ef4444', textDecoration: 'none', padding: '15px 0', borderBottom: '1px solid var(--border-color)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: '500' }}>Log out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '1.2rem', color: 'var(--accent-color)', textDecoration: 'none', padding: '15px 0', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>Sign In</Link>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Appearance</span>
              <button onClick={toggleTheme} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex' }}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="app-container">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/train/:id" element={<TrainDetails />} />
              <Route path="/class-selection/:id" element={<ClassSelection />} />
              <Route path="/passenger-details" element={<PassengerDetails />} />
              <Route path="/booking-confirmation" element={<BookingConfirmation />} />
              <Route path="/about" element={<About />} />
              <Route path="/premium-insights" element={<PremiumInsights />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
