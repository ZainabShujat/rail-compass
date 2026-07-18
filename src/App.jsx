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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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

import TrainDetails from './pages/TrainDetails';

// Placeholder components for 7-step journey (Weeks 1-2 UI structure)
const ClassSelection = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 5: Class/Seat Selection</h2><p>Choose Sleeper, 3AC, etc.</p></div>;
const PassengerDetails = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 6: Passenger Details</h2><p>Enter traveler info.</p></div>;
const BookingConfirmation = () => <div className="page-container glass-panel animate-fade-in"><h2>Step 7: Booking Confirmation</h2><p>Your ticket is booked!</p></div>;

const ToastManager = () => {
  const { welcomeMessage } = useAuth();
  if (!welcomeMessage) return null;

  return (
    <div style={{ position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, pointerEvents: 'none' }}>
      <div className="animate-fade-in" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--accent-fill))', color: 'white', padding: '8px 24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
        <span style={{ fontSize: '1.2rem' }}>👋</span>
        {welcomeMessage}
      </div>
    </div>
  );
};

function Navigation() {
  const [theme, setTheme] = useState('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
  
  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setShowLogoutModal(true);
  };
  
  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleHomeClick = () => {
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="app-header">
        <Link to="/" className="logo" onClick={handleHomeClick}>
          <img src="/logo.png" alt="Rail Compass Logo" style={{ width: '80px', height: 'auto', marginRight: '12px' }} />
          <span className="logo-text"><span className="logo-rail">RAIL</span> <span className="logo-compass">COMPASS</span></span>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <nav className="desktop-nav" style={{ alignItems: 'center', gap: '24px' }}>
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link to="/" className="nav-link" onClick={handleHomeClick}>Home</Link>
            <a href="#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#journeys" className="nav-link" onClick={() => setIsMenuOpen(false)}>Journeys</a>
            <a href="#guide" className="nav-link" onClick={() => setIsMenuOpen(false)}>Guide</a>
            <a href="#faq" className="nav-link" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            {!user && (
              <Link to="/login" className="btn-primary" style={{ padding: '8px 16px' }}>Sign In</Link>
            )}
          </nav>
          
          {/* Hamburger Icon */}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMenuOpen(true)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', alignItems: 'center' }}
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
              
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '5px' }}>
                  {user.picture ? <img src={user.picture} alt={user.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} /> : <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: '20px' }}>{user.name.charAt(0)}</span></div>}
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-main)' }}>Welcome,</div>
                    <div style={{ fontSize: '1rem', color: 'var(--accent-color)' }}>{user.name.split(' ')[0]}</div>
                  </div>
                </div>
              )}
              
              <Link to="/" onClick={handleHomeClick} style={{ fontSize: '1.2rem', color: 'var(--text-main)', textDecoration: 'none', padding: '15px 0', borderBottom: '1px solid var(--border-color)', fontWeight: '500' }}>Home</Link>
              
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '1.2rem', color: 'var(--text-main)', textDecoration: 'none', padding: '15px 0', borderBottom: '1px solid var(--border-color)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    My Profile
                  </Link>
                  <button onClick={handleLogoutClick} style={{ fontSize: '1.2rem', color: '#ef4444', textDecoration: 'none', padding: '15px 0', borderBottom: '1px solid var(--border-color)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: '500' }}>Log out</button>
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <>
          <div 
            className="drawer-overlay animate-fade-in" 
            onClick={() => setShowLogoutModal(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10002, backdropFilter: 'blur(3px)' }} 
          />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10003, width: '90%', maxWidth: '400px' }}>
            <div 
              className="animate-fade-in"
              style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', textAlign: 'center' }}
            >
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.4rem', color: 'var(--text-main)' }}>Sign Out</h3>
              <p style={{ margin: '0 0 25px 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Are you sure you want to log out of your account? You will need to sign back in to access your saved preferences.
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="btn-secondary" 
                  style={{ padding: '10px 20px', fontSize: '1rem', background: 'transparent' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmLogout} 
                  className="btn-primary" 
                  style={{ padding: '10px 20px', fontSize: '1rem', background: '#ef4444' }}
                >
                  Yes, Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="app-container">
          <ToastManager />
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
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
