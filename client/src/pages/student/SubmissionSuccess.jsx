import React, { useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const SubmissionSuccess = () => {
  const { state } = useLocation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const submission = state?.submission;
  const formTitle = state?.formTitle || 'Semester Student Feedback';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1">
      <div className="portal-card p-4 p-md-5 w-100 text-center" style={{ maxWidth: '600px' }}>
        <div className="stat-icon green bg-success bg-opacity-25 text-success mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}>
          <i className="bi bi-check-circle-fill"></i>
        </div>

        <h2 className="fw-bold text-light mb-2">Feedback Submitted Successfully</h2>
        <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
          Thank you for submitting your valuable feedback. Your evaluation has been encrypted and recorded into the system.
        </p>

        {submission && (
          <div className="portal-card p-4 bg-dark border-secondary text-start mb-4">
            <div className="row g-3" style={{ fontSize: '0.9rem' }}>
              <div className="col-sm-6">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>FEEDBACK REFERENCE ID</span>
                <strong className="text-warning fs-6">{submission.reference_number}</strong>
              </div>
              <div className="col-sm-6">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>SUBMISSION DATE & TIME</span>
                <strong className="text-light">{new Date(submission.submitted_at).toLocaleString()}</strong>
              </div>
              <div className="col-sm-6">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>STUDENT NAME</span>
                <span className="text-light">{user?.name}</span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>ENROLLMENT NUMBER</span>
                <span className="text-light">{user?.enrollment_number}</span>
              </div>
              <div className="col-12 border-top border-secondary pt-2">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>FORM TITLE</span>
                <span className="text-light fw-medium">{formTitle}</span>
              </div>
            </div>
          </div>
        )}

        <div className="alert alert-dark border-secondary p-3 mb-4 text-start" style={{ fontSize: '0.85rem' }}>
          <i className="bi bi-shield-check text-success me-2 fs-6"></i>
          Duplicate submission is prevented for this semester. You can view your submission status on your dashboard at any time.
        </div>

        <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
          <Link to="/student/dashboard" className="btn btn-gold py-2.5 px-4">
            <i className="bi bi-speedometer2 me-2"></i> Back to Dashboard
          </Link>
          <button onClick={handleLogout} className="btn btn-outline-danger py-2.5 px-4">
            <i className="bi bi-box-arrow-right me-2"></i> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
