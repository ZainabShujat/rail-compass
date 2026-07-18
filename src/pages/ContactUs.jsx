import React from 'react';
import { Mail, MessageCircle, Camera, Phone, MapPin, Smartphone, Apple } from 'lucide-react';
import './StandardPage.css'; // Let's create a common css if needed or just use inline/existing classes

export default function ContactUs() {
  return (
    <div className="page-container glass-panel animate-fade-in standard-page">
      <h2>Contact Us</h2>
      <p className="subtitle">We'd love to hear from you!</p>
      
      <div className="contact-grid">
        <div className="contact-info">
          <h3>Get in Touch</h3>
          <p>Reach out to us through any of the following channels. Our team is available 24/7 to assist you.</p>
          
          <ul className="contact-list">
            <li><Mail className="icon" /> <span>Email: hello@railcompass.in</span></li>
            <li><Phone className="icon" /> <span>Phone: +91 98765 43210</span></li>
            <li><MapPin className="icon" /> <span>Address: 123 Tech Park, Sector 45, Gurugram, Haryana 122003, India</span></li>
          </ul>

          <h3>Social Media</h3>
          <div className="social-links-contact">
            <a href="#" className="social-link-item"><MessageCircle className="icon" /> @RailCompass_IN</a>
            <a href="#" className="social-link-item"><Camera className="icon" /> @railcompass.official</a>
          </div>
        </div>
      </div>
    </div>
  );
}
