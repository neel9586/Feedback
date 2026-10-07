import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter administrative email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/admin/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Admin Login Error:', err);
      setError(err.response?.data?.message || 'Administrative authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1">
      <div className="portal-card border-danger p-4 p-md-5 w-100" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-4">
          <div className="stat-icon red bg-danger bg-opacity-25 text-danger mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <h3 className="fw-bold text-light mb-1">Admin Security Portal</h3>
          <span className="badge bg-danger text-light px-3 py-1 mb-2">Restricted Access</span>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Authorized personnel only. Role-Based Access Control active.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-4" role="alert" style={{ fontSize: '0.88rem' }}>
            <i className="bi bi-shield-exclamation flex-shrink-0"></i>
            <div>{error}</div>
          </div>
        )}



        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-light fw-medium" style={{ fontSize: '0.9rem' }}>
              Admin Email <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <i className="bi bi-envelope-at"></i>
              </span>
              <input
                type="email"
                className="form-control bg-dark text-light border-secondary"
                placeholder="admin@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-light fw-medium" style={{ fontSize: '0.9rem' }}>
              Password <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <i className="bi bi-key"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control bg-dark text-light border-secondary"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-danger w-100 py-2.5 mb-3 fw-bold">
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Authenticating Administrator...
              </>
            ) : (
              <>
                <i className="bi bi-shield-check me-2"></i> Authenticate as Admin
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-3 pt-3 border-top border-secondary">
          <Link to="/login" className="text-warning text-decoration-none" style={{ fontSize: '0.85rem' }}>
            <i className="bi bi-arrow-left me-1"></i> Return to Student Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
