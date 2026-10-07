import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const FeedbackList = () => {
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1 });
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('ALL');
  const [academicYear, setAcademicYear] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Submission Detail Modal
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete Modal
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSubmissions = async (page = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/submissions?search=${encodeURIComponent(search)}&semester=${semester}&academic_year=${academicYear}&page=${page}&limit=10`);
      if (res.data.success) {
        setSubmissions(res.data.submissions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to fetch feedback submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(1);
  }, [search, semester, academicYear]);

  // View Detailed Response Modal
  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await API.get(`/admin/submissions/${id}`);
      if (res.data.success) {
        setSelectedDetail(res.data);
      }
    } catch (err) {
      console.error('Error loading detail:', err);
      alert('Could not load submission detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Delete Submission
  const handleDeleteSubmission = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await API.delete(`/admin/submissions/${deleteTargetId}`);
      if (res.data.success) {
        setDeleteTargetId(null);
        fetchSubmissions(pagination.currentPage);
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
      alert('Failed to delete submission.');
    } finally {
      setDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    const url = `/api/admin/export-csv?semester=${semester}&academic_year=${academicYear}`;
    
    // Fetch directly via Axios for download trigger
    API.get(url, { responseType: 'blob' })
      .then(response => {
        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `Feedback_Submissions_Export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(err => {
        console.error('Export CSV error:', err);
        alert('Failed to export CSV file.');
      });
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom border-secondary gap-3">
        <div>
          <h2 className="fw-bold text-light mb-1">
            <i className="bi bi-table me-2 text-warning"></i> All Student Feedback Submissions
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
            View, search, filter, analyze, and export submitted semester evaluations
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn btn-gold py-2 px-3 fw-bold">
          <i className="bi bi-file-earmark-excel-fill me-2"></i> Export Data to CSV
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="portal-card p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-dark text-muted border-secondary">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                placeholder="Search by student name, enrollment no, email, or reference code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select bg-dark text-light border-secondary"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="ALL">All Semesters</option>
              <option value="SEM 1">Sem 1</option>
              <option value="SEM 3">Sem 3</option>
              <option value="SEM 5">Sem 5</option>
              <option value="SEM 7">Sem 7</option>
              <option value="SEM 9">Sem 9</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select bg-dark text-light border-secondary"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              <option value="ALL">All Academic Years</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <div className="col-md-1 text-end">
            <button
              onClick={() => { setSearch(''); setSemester('ALL'); setAcademicYear('ALL'); }}
              className="btn btn-outline-secondary w-100"
              title="Reset Filters"
            >
              <i className="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Submissions Data Table */}
      <div className="portal-card p-0 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-dark-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Student Details</th>
                <th>Course / Semester</th>
                <th>Academic Year</th>
                <th>Avg Rating</th>
                <th>Submitted At</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-warning me-2"></div>
                    Loading submissions...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox display-4 d-block mb-2 text-secondary"></i>
                    No student feedback submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                submissions.map(sub => (
                  <tr key={sub.id}>
                    <td>
                      <span className="font-monospace fw-bold text-warning">{sub.reference_number}</span>
                    </td>
                    <td>
                      <div className="fw-bold text-light">{sub.student_name}</div>
                      <small className="text-muted">{sub.enrollment_number} • {sub.student_email}</small>
                    </td>
                    <td>
                      <span className="badge bg-dark border border-secondary text-light">{sub.course}</span>
                      <span className="badge bg-warning text-dark ms-1">{sub.semester}</span>
                    </td>
                    <td>{sub.academic_year}</td>
                    <td>
                      <span className="badge bg-success text-light fs-6">
                        <i className="bi bi-star-fill me-1" style={{ fontSize: '0.75rem' }}></i>
                        {sub.avg_rating} / 5.0
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                    <td className="text-end px-4">
                      <button
                        onClick={() => handleViewDetail(sub.id)}
                        className="btn btn-outline-warning btn-sm me-2"
                        title="View Detailed Evaluation"
                      >
                        <i className="bi bi-eye-fill me-1"></i> View
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(sub.id)}
                        className="btn btn-outline-danger btn-sm"
                        title="Delete Response"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top border-secondary bg-dark">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} total records)
            </span>
            <div className="d-flex gap-1">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchSubmissions(pagination.currentPage - 1)}
                className="btn btn-outline-secondary btn-sm px-3"
              >
                Previous
              </button>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchSubmissions(pagination.currentPage + 1)}
                className="btn btn-outline-secondary btn-sm px-3"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedDetail && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content bg-dark text-light border-warning">
              <div className="modal-header border-secondary">
                <h5 className="modal-header-title text-warning fw-bold mb-0">
                  <i className="bi bi-file-earmark-person-fill me-2"></i> Feedback Response Detail
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedDetail(null)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Student Info Bar */}
                <div className="portal-card p-3 mb-4 bg-secondary bg-opacity-25">
                  <div className="row g-2" style={{ fontSize: '0.88rem' }}>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">STUDENT NAME</span>
                      <strong className="text-light">{selectedDetail.submission.student_name}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">ENROLLMENT NO.</span>
                      <strong className="text-warning">{selectedDetail.submission.enrollment_number}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">EMAIL ADDRESS</span>
                      <span className="text-light">{selectedDetail.submission.student_email}</span>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">SEMESTER & YEAR</span>
                      <span className="text-light">{selectedDetail.submission.semester} ({selectedDetail.submission.academic_year})</span>
                    </div>
                  </div>
                </div>

                {/* Grouped Subject/Faculty Ratings */}
                {selectedDetail.groupedAnswers.map((group, idx) => (
                  <div key={idx} className="portal-card p-3 mb-3 border-secondary">
                    <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                      <h6 className="fw-bold text-light mb-0">
                        <i className="bi bi-journal-bookmark-fill me-2 text-warning"></i> {group.subject_name}
                      </h6>
                      <span className="badge bg-warning text-dark fw-bold fs-6">
                        Faculty: {group.faculty_name}
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm table-dark-custom mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Evaluation Question</th>
                            <th style={{ width: '120px' }}>Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.ratings.map((r, qIdx) => (
                            <tr key={qIdx}>
                              <td className="text-light">{r.display_order}. {r.question_text}</td>
                              <td>
                                <span className={`badge ${r.rating >= 4 ? 'bg-success' : r.rating === 3 ? 'bg-warning text-dark' : 'bg-danger'} px-2 py-1 fs-6`}>
                                  {r.rating} / 5
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedDetail(null)}>
                  Close Response View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light border-danger">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-danger fw-bold mb-0">
                  <i className="bi bi-trash-fill me-2"></i> Confirm Deletion
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeleteTargetId(null)}></button>
              </div>
              <div className="modal-body py-4 text-center">
                <p className="text-light mb-0">
                  Are you sure you want to permanently delete this student feedback submission? This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteTargetId(null)} disabled={deleting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteSubmission} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
