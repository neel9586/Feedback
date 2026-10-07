import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await API.get('/student/dashboard-status');
        if (res.data.success) {
          setStatusData(res.data);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Could not load feedback status. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center text-light">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p className="text-muted">Loading your academic profile & feedback status...</p>
      </div>
    );
  }

  const isSubmitted = statusData?.hasSubmitted;

  return (
    <div className="container py-4 flex-grow-1">
      {/* Welcome Banner */}
      <div className="portal-card p-4 mb-4 background-gradient-dark border-warning" style={{ borderLeft: '4px solid #F59E0B' }}>
        <div className="row align-items-center">
          <div className="col-md-8">
            <h2 className="fw-bold text-light mb-1">
              Welcome, {user?.name}!
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
              Student Portal • {user?.course} ({user?.semester}) - Academic Year {user?.academic_year}
            </p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <span className="badge bg-dark border border-secondary text-warning px-3 py-2 fs-6">
              <i className="bi bi-person-vcard me-2"></i> {user?.enrollment_number}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-4">{error}</div>
      )}

      <div className="row g-4">
        {/* Feedback Status Card */}
        <div className="col-lg-7">
          <div className="portal-card h-100 p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary pb-3">
              <h5 className="fw-bold text-light mb-0">
                <i className="bi bi-clipboard-data me-2 text-warning"></i> Semester Feedback Status
              </h5>
              <span className={`badge ${isSubmitted ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2 fs-6`}>
                {isSubmitted ? 'Feedback Submitted' : 'Feedback Pending'}
              </span>
            </div>

            {statusData?.form ? (
              <div>
                <h6 className="text-light fw-bold mb-2">{statusData.form.title}</h6>
                <div className="row g-2 mb-4 text-muted" style={{ fontSize: '0.88rem' }}>
                  <div className="col-6">
                    <i className="bi bi-book me-1 text-warning"></i> Semester: <span className="text-light">{statusData.form.semester}</span>
                  </div>
                  <div className="col-6">
                    <i className="bi bi-calendar3 me-1 text-warning"></i> Academic Session: <span className="text-light">{statusData.form.academic_year}</span>
                  </div>
                </div>

                {isSubmitted ? (
                  <div className="alert alert-success border-success bg-opacity-10 text-light p-3 rounded-3 mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2 text-success fw-bold">
                      <i className="bi bi-check-circle-fill fs-5"></i> Feedback Submitted Successfully
                    </div>
                    <p className="mb-1 text-muted" style={{ fontSize: '0.88rem' }}>
                      Thank you for providing your valuable evaluation. Your response has been recorded.
                    </p>
                    <div className="mt-2 pt-2 border-top border-secondary text-secondary" style={{ fontSize: '0.8rem' }}>
                      Reference Code: <strong className="text-light">{statusData.submission?.reference_number}</strong> • Submitted: {new Date(statusData.submission?.submitted_at).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning border-warning bg-opacity-10 text-light p-3 rounded-3 mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2 text-warning fw-bold">
                      <i className="bi bi-exclamation-circle-fill fs-5"></i> Action Required
                    </div>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.88rem' }}>
                      Please evaluate your faculty members for each course before the submission deadline. All ratings are required.
                    </p>
                  </div>
                )}

                <div className="d-grid gap-2">
                  {isSubmitted ? (
                    <button className="btn btn-outline-secondary py-2.5" disabled>
                      <i className="bi bi-lock-fill me-2"></i> Feedback Already Submitted
                    </button>
                  ) : (
                    <Link to="/student/feedback" className="btn btn-gold py-2.5 fw-bold">
                      <i className="bi bi-pencil-square me-2"></i> Open Feedback Form
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x display-4 text-secondary mb-2 d-block"></i>
                No active feedback forms currently configured for {user?.semester}.
              </div>
            )}
          </div>
        </div>

        {/* Student Information Profile */}
        <div className="col-lg-5">
          <div className="portal-card h-100 p-4">
            <h5 className="fw-bold text-light mb-3 border-bottom border-secondary pb-3">
              <i className="bi bi-person-badge me-2 text-warning"></i> Academic Profile
            </h5>

            <div className="mb-3">
              <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>FULL NAME</label>
              <span className="fw-semibold text-light fs-6">{user?.name}</span>
            </div>

            <div className="mb-3">
              <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>ENROLLMENT NUMBER</label>
              <span className="fw-semibold text-light fs-6">{user?.enrollment_number}</span>
            </div>

            <div className="mb-3">
              <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>EMAIL ADDRESS</label>
              <span className="fw-semibold text-light fs-6">{user?.email}</span>
            </div>

            <div className="row g-2">
              <div className="col-4 mb-3">
                <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>COURSE</label>
                <span className="fw-semibold text-light">{user?.course || 'IMsc IT'}</span>
              </div>
              <div className="col-4 mb-3">
                <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>SEMESTER</label>
                <span className="fw-semibold text-warning">{user?.semester}</span>
              </div>
              <div className="col-4 mb-3">
                <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>DIVISION</label>
                <span className="fw-semibold text-info">{user?.division || 'Div A'}</span>
              </div>
            </div>

            <div className="mt-2 pt-3 border-top border-secondary text-muted" style={{ fontSize: '0.8rem' }}>
              <i className="bi bi-shield-check me-1 text-success"></i> Account Status: <strong className="text-success">Active & Verified</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
