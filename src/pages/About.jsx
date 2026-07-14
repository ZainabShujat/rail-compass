import React from 'react';
import './StandardPage.css';

export default function About() {
  return (
    <div className="page-container glass-panel animate-fade-in standard-page">
      <h2>About Rail Compass</h2>
      <p>
        Welcome to Rail Compass, India's premier personalized railway discovery platform. 
        We are dedicated to transforming your journey with precise routing, smart budget tracking, and premium travel insights.
      </p>
      <h3>Our Mission</h3>
      <p>
        Our mission is to simplify train travel across India. Whether you are a daily commuter or an occasional traveler, 
        Rail Compass provides the tools you need to plan, book, and enjoy your journey seamlessly.
      </p>
      <h3>Why Choose Us?</h3>
      <ul>
        <li><strong>Smart Routing:</strong> Find the most optimal paths for your destination.</li>
        <li><strong>Budget Tracking:</strong> Keep your travel expenses in check with our advanced tools.</li>
        <li><strong>Premium Insights:</strong> Access detailed analytics and trends about railway availability and punctuality.</li>
      </ul>
      <p>
        Join thousands of satisfied travelers who trust Rail Compass for their daily and vacation travel needs.
      </p>
    </div>
  );
}
