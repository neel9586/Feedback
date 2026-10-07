import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 p-4">
      <div className="portal-card text-center p-5 max-w-500 shadow-lg" style={{ maxWidth: '540px' }}>
        <div className="text-danger mb-3">
          <i className="bi bi-shield-lock-fill display-1"></i>
        </div>
        <h2 className="fw-bold text-light mb-2">403 - Access Denied</h2>
        <p className="text-muted mb-4">
          You do not have administrative privileges to access this area. All admin endpoints and dashboards are strictly restricted to verified administrators.
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <Link to="/student/dashboard" className="btn btn-gold">
            <i className="bi bi-house-door-fill me-2"></i> Student Dashboard
          </Link>
          <Link to="/login" className="btn btn-outline-light">
            <i className="bi bi-box-arrow-in-right me-2"></i> Login Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
