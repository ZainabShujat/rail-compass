import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Train, Sun, Moon } from 'lucide-react';
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
import Footer from './components/Footer';
import './index.css';

// Placeholder components for 7-step journey (Weeks 1-2 UI structure)
const TrainDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 4: Train Details</h2><p>Compare amenities and metrics.</p></div>;
const ClassSelection = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 5: Class/Seat Selection</h2><p>Choose Sleeper, 3AC, etc.</p></div>;
const PassengerDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 6: Passenger Details</h2><p>Enter traveler info.</p></div>;
const BookingConfirmation = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 7: Booking Confirmation</h2><p>Your ticket is booked!</p></div>;

function Navigation() {
  const [theme, setTheme] = useState('dark');
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
      <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Link to="/" className="nav-link">Home</Link>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.picture && <img src={user.picture} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />}
              Welcome, {user.name.split(' ')[0]}
            </span>
            <button onClick={logout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Sign Out</button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '8px 16px' }}>Sign In</Link>
        )}
      </nav>
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
