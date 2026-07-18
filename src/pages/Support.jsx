import React from 'react';
import './StandardPage.css';

export default function Support() {
  return (
    <div className="page-container glass-panel animate-fade-in standard-page">
      <h2>Support Center</h2>
      <p className="subtitle">How can we help you today?</p>

      <div className="support-sections">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-item">
          <h4>How do I book a ticket?</h4>
          <p>You can search for your train on the home page, select your preferred class, and follow the simple checkout process.</p>
        </div>

        <div className="faq-item">
          <h4>I forgot my password, what should I do?</h4>
          <p>Click on the 'Forgot Password' link on the login page to receive a password reset link on your registered email ID.</p>
        </div>

        <h3>Need More Help?</h3>
        <p>If you couldn't find the answer to your question, our support team is ready to assist you. You can reach out to us at hello@railcompass.in.</p>
      </div>
    </div>
  );
}
