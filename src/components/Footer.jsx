import { Link } from 'react-router-dom';
import { Globe, Mail } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="global-footer glass-panel">
      <div className="footer-content">
        
        {/* Left Column: Brand & Description */}
        <div className="footer-brand">
          <Link to="/" className="logo footer-logo">
            <img src="/logo.png" alt="Rail Compass Logo" />
            <span className="logo-text"><span className="logo-rail">RAIL</span> <span className="logo-compass">COMPASS</span></span>
          </Link>
          <p className="footer-description text-muted">
            India's premier personalized railway discovery platform.<br />
            Mastering your journey with precise routing, smart budget tracking, and premium travel insights.
          </p>
          <div className="social-icons">
            <a href="#" aria-label="Website" className="social-link"><Globe size={20} /></a>
            <a href="#" aria-label="Contact" className="social-link"><Mail size={20} /></a>
          </div>
        </div>

        {/* Middle Column: Company */}
        <div className="footer-links-group">
          <h4 className="footer-heading">COMPANY</h4>
          <ul className="footer-links">
            <li><Link to="/about">About Rail Compass</Link></li>
            <li><Link to="/premium-insights">Premium Insights</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/support">Support</Link></li>
          </ul>
        </div>

        {/* Right Column: Legal */}
        <div className="footer-links-group">
          <h4 className="footer-heading">LEGAL</h4>
          <ul className="footer-links">
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
          </ul>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        <p className="copyright text-muted">
          &copy; {new Date().getFullYear()} RAIL COMPASS. ALL RIGHTS RESERVED.
        </p>
        <div className="bottom-links">
          <Link to="/privacy-policy">PRIVACY POLICY</Link>
          <Link to="/terms-conditions">TERMS & CONDITIONS</Link>
        </div>
      </div>
    </footer>
  );
}
