import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    enrollment_number: '',
    password: '',
    confirmPassword: '',
    course: 'IMsc IT',
    semester: 'SEM 7',
    division: 'Division A',
    academic_year: '2026-2027'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, enrollment_number, password, confirmPassword } = formData;

    if (!name || !email || !enrollment_number || !password) {
      setError('Please fill in all required fields marked with *.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/register', formData);
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('Registration Error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDivisionApplicable = ['SEM 1', 'SEM 3', 'SEM 5'].includes(formData.semester);

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1">
      <div className="portal-card p-4 p-md-5 w-100" style={{ maxWidth: '580px' }}>
        <div className="text-center mb-4">
          <div className="stat-icon gold mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <h3 className="fw-bold text-light mb-1">Student Registration</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            Create your IMsc IT student account to submit semester faculty feedback
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-4" role="alert" style={{ fontSize: '0.88rem' }}>
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                Full Name <span className="text-warning">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-control bg-dark text-light border-secondary"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                Enrollment Number <span className="text-warning">*</span>
              </label>
              <input
                type="text"
                name="enrollment_number"
                className="form-control bg-dark text-light border-secondary"
                placeholder="e.g. 202507001"
                value={formData.enrollment_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                Email Address <span className="text-warning">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-control bg-dark text-light border-secondary"
                placeholder="rahul.student@college.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Course Field - Locked strictly to IMsc IT */}
            <div className="col-md-6">
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                Course / Program <span className="text-warning">*</span>
              </label>
              <input
                type="text"
                name="course"
                className="form-control bg-dark text-warning border-warning fw-bold"
                value="IMsc IT"
                readOnly
                disabled
              />
            </div>

            {/* Semester Selection */}
            <div className={isDivisionApplicable ? 'col-md-3' : 'col-md-6'}>
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                Semester <span className="text-warning">*</span>
              </label>
              <select
                name="semester"
                className="form-select bg-dark text-light border-secondary"
                value={formData.semester}
                onChange={handleChange}
              >
                <option value="SEM 1">Sem 1</option>
                <option value="SEM 3">Sem 3</option>
                <option value="SEM 5">Sem 5</option>
                <option value="SEM 7">Sem 7</option>
                <option value="SEM 9">Sem 9</option>
              </select>
            </div>

            {/* Dynamic Division Selection (for Sem 1, Sem 3, Sem 5) */}
            {isDivisionApplicable && (
              <div className="col-md-3">
                <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                  Division <span className="text-warning">*</span>
                </label>
                <select
                  name="division"
                  className="form-select bg-dark text-warning border-warning fw-bold"
                  value={formData.division}
                  onChange={handleChange}
                >
                  <option value="Division A">Division A</option>
                  <option value="Division B">Division B</option>
                </select>
              </div>
            )}

            {/* Academic Year - Locked to 2026-2027 */}
            <div className="col-md-6">
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                Academic Year <span className="text-warning">*</span>
              </label>
              <input
                type="text"
                name="academic_year"
                className="form-control bg-dark text-light border-secondary"
                value="2026-2027"
                readOnly
                disabled
              />
            </div>

            <div className="col-md-6">
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                Password <span className="text-warning">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="col-md-6">
              <label className="form-label text-light fw-medium" style={{ fontSize: '0.88rem' }}>
                Confirm Password <span className="text-warning">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-control bg-dark text-light border-secondary"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold w-100 py-2.5 mt-4 mb-3" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Creating Account...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i> Register Student Account
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-2 pt-3 border-top border-secondary text-muted" style={{ fontSize: '0.88rem' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-warning text-decoration-none fw-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
