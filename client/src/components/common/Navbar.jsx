import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar sticky-top">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center gap-2" to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}>
          <i className="bi bi-mortarboard-fill text-warning fs-3"></i>
          <div>
            <span className="brand-title">SSASIT Portal</span>
            <small className="d-block text-muted" style={{ fontSize: '0.65rem', marginTop: '-4px' }}>
              Student Feedback System
            </small>
          </div>
        </Link>

        <div className="d-flex align-items-center gap-2 d-lg-none">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`bi bi-${theme === 'dark' ? 'sun-fill' : 'moon-stars-fill'}`}></i>
          </button>

          <button className="navbar-toggler border-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>

        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 gap-1">
            {user && user.role === 'student' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-light px-3" to="/student/dashboard">
                    <i className="bi bi-speedometer2 me-2 text-warning"></i>Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-3" to="/student/feedback">
                    <i className="bi bi-clipboard-check me-2 text-warning"></i>Fill Feedback
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-3" to="/student/profile">
                    <i className="bi bi-person-badge me-2 text-warning"></i>My Profile
                  </Link>
                </li>
              </>
            )}

            {user && user.role === 'admin' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/dashboard">
                    <i className="bi bi-pie-chart-fill me-1 text-warning"></i>Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/faculty">
                    <i className="bi bi-person-workspace me-1 text-warning"></i>Manage Faculty
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/subjects">
                    <i className="bi bi-journal-text me-1 text-warning"></i>Manage Subjects
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/mappings">
                    <i className="bi bi-diagram-3 me-1 text-warning"></i>Mappings
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/forms">
                    <i className="bi bi-file-earmark-plus me-1 text-warning"></i>Forms
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/students">
                    <i className="bi bi-people me-1 text-warning"></i>Students
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/feedback">
                    <i className="bi bi-table me-1 text-warning"></i>All Feedback
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/upload-excel">
                    <i className="bi bi-file-earmark-spreadsheet me-1 text-warning"></i>Upload Feedback
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-2" to="/admin/upload-analysis">
                    <i className="bi bi-bar-chart-line me-1 text-warning"></i>Upload Analysis
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* Desktop Theme Toggle Icon */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn d-none d-lg-flex"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <i className={`bi bi-${theme === 'dark' ? 'sun-fill' : 'moon-stars-fill'}`}></i>
            </button>

            {user ? (
              <div className="d-flex align-items-center gap-3">
                <div className="text-end d-none d-md-block">
                  <div className="fw-semibold text-light" style={{ fontSize: '0.9rem' }}>{user.name}</div>
                  <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-warning text-dark'} text-capitalize`}>
                    {user.role} {user.semester ? `(${user.semester})` : ''}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm px-3">
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-gold btn-sm px-3">Student Login</Link>
                <Link to="/admin/login" className="btn btn-danger btn-sm px-3">Admin Portal</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
