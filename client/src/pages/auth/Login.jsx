import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Please enter your Email or Enrollment Number and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/login', { identifier, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1">
      <div className="portal-card p-4 p-md-5 w-100" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-4">
          <div className="stat-icon gold mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
            <i className="bi bi-person-circle"></i>
          </div>
          <h3 className="fw-bold text-light mb-1">Student Portal Login</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            Sign in to complete your semester feedback
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-4" role="alert" style={{ fontSize: '0.88rem' }}>
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-light fw-medium" style={{ fontSize: '0.9rem' }}>
              Email or Enrollment Number <span className="text-warning">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                placeholder="e.g. neel.student@college.edu or 202609001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.9rem' }}>
                Password <span className="text-warning">*</span>
              </label>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control bg-dark text-light border-secondary"
                placeholder="Enter password"
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

          <button type="submit" className="btn btn-gold w-100 py-2.5 mb-3" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Authenticating...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i> Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-3 pt-3 border-top border-secondary text-muted" style={{ fontSize: '0.88rem' }}>
          Don't have a student account?{' '}
          <Link to="/register" className="text-warning text-decoration-none fw-semibold">
            Register Here
          </Link>
        </div>

        <div className="text-center mt-3">
          <Link to="/admin/login" className="text-secondary text-decoration-none" style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-shield-lock me-1"></i> Admin Portal Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
