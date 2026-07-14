import React from 'react';
import './StandardPage.css';

export default function PremiumInsights() {
  return (
    <div className="page-container glass-panel animate-fade-in standard-page">
      <h2>Premium Insights</h2>
      <p className="subtitle">Unlock the Power of Data with Rail Compass Premium.</p>
      
      <div className="insights-content">
        <h3>What are Premium Insights?</h3>
        <p>
          Premium Insights offer an exclusive look into railway patterns, helping you make smarter travel decisions. 
          By analyzing years of train data, we provide predictive analytics that give you an edge in securing confirmed tickets and planning reliable itineraries.
        </p>

        <h3>Key Features</h3>
        <ul>
          <li><strong>Waitlist Prediction:</strong> Highly accurate predictions on the confirmation probability of waitlisted tickets based on historical trends.</li>
          <li><strong>Delay Analytics:</strong> Understand the historical punctuality of specific trains across different seasons and days of the week.</li>
          <li><strong>Dynamic Pricing Alerts:</strong> Get notified about fare changes in premium trains like Rajdhani, Shatabdi, and Vande Bharat.</li>
          <li><strong>Alternate Route Suggestions:</strong> Smart algorithms that suggest split-journey tickets when direct trains are full.</li>
        </ul>

        <p>Upgrade to Premium today to experience hassle-free travel planning.</p>
      </div>
    </div>
  );
}
