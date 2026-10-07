import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

const FeedbackForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [currentStep, setCurrentStep] = useState(0); // 0 = Student Verification, 1..N = Subject/Faculty sections, N+1 = Review & Submit
  const [ratings, setRatings] = useState({}); // key: `${mapping_id}_${question_id}`, value: number
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const res = await API.get('/student/active-form');
        if (res.data.success) {
          setFormData(res.data.form);
          setQuestions(res.data.questions);
          setMappings(res.data.subjectFacultyMappings);
        }
      } catch (err) {
        console.error('Error fetching feedback form:', err);
        if (err.response?.data?.alreadySubmitted) {
          navigate('/student/dashboard');
        } else {
          setError(err.response?.data?.message || 'Failed to load active feedback form.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container py-5 text-center text-light">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p className="text-muted">Loading feedback form questions & faculty mappings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="portal-card p-4 text-center max-w-500 mx-auto">
          <i className="bi bi-exclamation-triangle-fill display-3 text-warning mb-3"></i>
          <h4 className="fw-bold text-light mb-2">Form Unavailable</h4>
          <p className="text-muted mb-4">{error}</p>
          <button onClick={() => navigate('/student/dashboard')} className="btn btn-gold">
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalSubjectSteps = mappings.length;
  const totalSteps = totalSubjectSteps + 2; // Step 0 (Verify), 1..N (Subjects), N+1 (Review)
  const progressPercent = Math.round((currentStep / (totalSteps - 1)) * 100);

  const handleRatingSelect = (mappingId, questionId, ratingValue) => {
    setRatings(prev => ({
      ...prev,
      [`${mappingId}_${questionId}`]: ratingValue
    }));
  };

  // Validate if all 10 questions are answered for current subject section
  const isCurrentStepValid = () => {
    if (currentStep === 0) return true; // Student verify
    if (currentStep > totalSubjectSteps) return true; // Review step

    const currentMapping = mappings[currentStep - 1];
    if (!currentMapping) return false;

    return questions.every(q => ratings[`${currentMapping.mapping_id}_${q.id}`] !== undefined);
  };

  const handleNextStep = () => {
    if (!isCurrentStepValid()) {
      setError('Please provide a rating for all 10 evaluation questions before proceeding.');
      return;
    }
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmitFinal = async () => {
    setSubmitting(true);
    setError('');

    // Format ratings payload
    const formattedRatings = [];
    mappings.forEach(m => {
      questions.forEach(q => {
        const key = `${m.mapping_id}_${q.id}`;
        if (ratings[key]) {
          formattedRatings.push({
            question_id: q.id,
            subject_id: m.subject_id,
            faculty_id: m.faculty_id,
            rating: ratings[key]
          });
        }
      });
    });

    try {
      const res = await API.post('/student/submit-feedback', {
        feedback_form_id: formData.id,
        ratings: formattedRatings
      });

      if (res.data.success) {
        setShowConfirmModal(false);
        navigate('/student/success', { state: { submission: res.data.submission, formTitle: formData.title } });
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const currentMapping = currentStep > 0 && currentStep <= totalSubjectSteps ? mappings[currentStep - 1] : null;

  return (
    <div className="container py-4 flex-grow-1" style={{ maxWidth: '900px' }}>
      {/* Form Header Card */}
      <div className="portal-card p-4 mb-4 background-gradient-dark border-warning">
        <h3 className="fw-bold text-light mb-1">{formData?.title}</h3>
        <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>
          5 = Excellent • 4 = Very Good • 3 = Good • 2 = Poor • 1 = Very Poor
        </p>

        {/* Wizard Progress Bar */}
        <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: '0.8rem' }}>
          <span>Progress: Step {currentStep + 1} of {totalSteps}</span>
          <span className="fw-bold text-warning">{progressPercent}% Completed</span>
        </div>
        <div className="wizard-progress">
          <div className="wizard-progress-bar" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* STEP 0: Student Details Verification */}
      {currentStep === 0 && (
        <div className="portal-card p-4 p-md-5 mb-4">
          <h5 className="fw-bold text-light mb-3 border-bottom border-secondary pb-3">
            <i className="bi bi-person-check-fill me-2 text-warning"></i> Step 1: Verify Student Credentials
          </h5>

          <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
            Please confirm your identity and academic program before beginning the subject/faculty evaluations.
          </p>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>EMAIL ADDRESS <span className="text-warning">*</span></label>
              <input type="text" className="form-control bg-dark text-light border-secondary" value={user?.email} disabled />
            </div>
            <div className="col-md-6">
              <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>FULL NAME <span className="text-warning">*</span></label>
              <input type="text" className="form-control bg-dark text-light border-secondary" value={user?.name} disabled />
            </div>
            <div className="col-md-6">
              <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>ENROLLMENT NUMBER <span className="text-warning">*</span></label>
              <input type="text" className="form-control bg-dark text-light border-secondary" value={user?.enrollment_number} disabled />
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>COURSE</label>
              <input type="text" className="form-control bg-dark text-light border-secondary" value={user?.course} disabled />
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>SEMESTER</label>
              <input type="text" className="form-control bg-dark text-light border-secondary text-warning fw-bold" value={user?.semester} disabled />
            </div>
          </div>

          <div className="alert alert-dark border-secondary p-3 mb-4" style={{ fontSize: '0.85rem' }}>
            <i className="bi bi-info-circle me-2 text-warning"></i>
            You will evaluate <strong>{totalSubjectSteps} Subject-Faculty pairs</strong>. All 10 questions per section are required.
          </div>

          <div className="d-flex justify-content-end">
            <button onClick={handleNextStep} className="btn btn-gold px-4 py-2">
              Start Evaluation <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* STEP 1..N: Subject & Faculty Rating Sections */}
      {currentStep > 0 && currentStep <= totalSubjectSteps && currentMapping && (
        <div className="portal-card p-4 p-md-5 mb-4">
          <div className="d-flex align-items-center justify-content-between border-bottom border-secondary pb-3 mb-4">
            <div>
              <span className="badge bg-warning text-dark me-2">Section {currentStep} of {totalSubjectSteps}</span>
              <h4 className="fw-bold text-light d-inline-block mb-0 mt-1">
                {currentMapping.subject_name} {currentMapping.subject_code ? `(${currentMapping.subject_code})` : ''}
              </h4>
            </div>
            <div className="text-end">
              <label className="text-muted d-block" style={{ fontSize: '0.75rem' }}>FACULTY IN-CHARGE</label>
              <span className="fw-bold text-warning fs-6">
                <i className="bi bi-person-workspace me-1"></i> {currentMapping.faculty_name}
              </span>
            </div>
          </div>

          <p className="text-muted mb-4" style={{ fontSize: '0.88rem' }}>
            Rate the performance of <strong>{currentMapping.faculty_name}</strong> for <strong>{currentMapping.subject_name}</strong> on a scale of 1 to 5:
          </p>

          {/* 10 Rating Questions */}
          {questions.map((q, idx) => {
            const selectedVal = ratings[`${currentMapping.mapping_id}_${q.id}`];

            return (
              <div key={q.id} className="rating-question-card">
                <div className="rating-question-title">
                  {idx + 1}. {q.question_text} <span className="text-warning">*</span>
                </div>

                <div className="rating-options-grid">
                  {[
                    { val: 1, label: 'Very Poor' },
                    { val: 2, label: 'Poor' },
                    { val: 3, label: 'Good' },
                    { val: 4, label: 'Very Good' },
                    { val: 5, label: 'Excellent' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      className={`rating-option-btn ${selectedVal === opt.val ? 'selected' : ''}`}
                      onClick={() => handleRatingSelect(currentMapping.mapping_id, q.id, opt.val)}
                    >
                      <span className="rating-number">{opt.val}</span>
                      <span className="rating-label">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="d-flex justify-content-between mt-4 pt-3 border-top border-secondary">
            <button onClick={handlePrevStep} className="btn btn-outline-secondary px-4">
              <i className="bi bi-arrow-left me-2"></i> Previous
            </button>
            <button onClick={handleNextStep} className="btn btn-gold px-4">
              Next Section <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* STEP N+1: Final Review & Submit Step */}
      {currentStep === totalSteps - 1 && (
        <div className="portal-card p-4 p-md-5 mb-4">
          <h4 className="fw-bold text-light mb-3 border-bottom border-secondary pb-3">
            <i className="bi bi-check2-all me-2 text-warning"></i> Final Review & Feedback Submission
          </h4>

          <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
            Please review your evaluated sections below before final submission.
          </p>

          <div className="row g-3 mb-4">
            {mappings.map((m, idx) => {
              const answeredCount = questions.filter(q => ratings[`${m.mapping_id}_${q.id}`] !== undefined).length;
              const isComplete = answeredCount === questions.length;

              return (
                <div key={m.mapping_id} className="col-md-6">
                  <div className={`p-3 rounded-3 border ${isComplete ? 'border-success bg-dark' : 'border-danger bg-dark'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="fw-bold text-light mb-0">{m.subject_name}</h6>
                      {isComplete ? (
                        <span className="badge bg-success"><i className="bi bi-check me-1"></i> Completed</span>
                      ) : (
                        <span className="badge bg-danger">Incomplete ({answeredCount}/10)</span>
                      )}
                    </div>
                    <small className="text-muted d-block mt-1">Faculty: <span className="text-warning">{m.faculty_name}</span></small>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="alert alert-dark border-secondary p-3 mb-4" style={{ fontSize: '0.85rem' }}>
            <i className="bi bi-shield-lock me-2 text-warning"></i>
            Once submitted, your feedback is locked for <strong>{user?.semester} ({user?.academic_year})</strong> and cannot be edited.
          </div>

          <div className="d-flex justify-content-between">
            <button onClick={handlePrevStep} className="btn btn-outline-secondary px-4">
              <i className="bi bi-arrow-left me-2"></i> Back to Review Questions
            </button>
            <button onClick={() => setShowConfirmModal(true)} className="btn btn-gold px-4 py-2 fs-6 fw-bold">
              <i className="bi bi-send-fill me-2"></i> Submit Feedback Form
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal Dialogue */}
      {showConfirmModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light border-warning">
              <div className="modal-header border-secondary">
                <h5 className="modal-header-title text-warning fw-bold mb-0">
                  <i className="bi bi-question-circle-fill me-2"></i> Confirm Feedback Submission
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body py-4 text-center">
                <i className="bi bi-exclamation-triangle-fill display-4 text-warning mb-3 d-block"></i>
                <h5 className="fw-bold text-light mb-2">Are you sure you want to submit?</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  "Are you sure you want to submit your feedback? You will not be able to modify it after submission."
                </p>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setShowConfirmModal(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-gold px-4" onClick={handleSubmitFinal} disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span> Submitting...
                    </>
                  ) : (
                    'Confirm & Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;
