import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto py-3 bg-dark border-top border-secondary text-center text-muted" style={{ fontSize: '0.85rem' }}>
      <div className="container">
        <p className="mb-1">
          © {new Date().getFullYear()} <strong className="text-light">SHREE SWAMI ATMANAND SARASWATI INSTITUTE OF TECHNOLOGY</strong>
        </p>
        <p className="mb-0 text-secondary" style={{ fontSize: '0.78rem' }}>
          Student Feedback Management System • Confidential & Secure Feedback Module
        </p>
      </div>
    </footer>
  );
};

export default Footer;
