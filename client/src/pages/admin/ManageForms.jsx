import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const ManageForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    course: 'IMsc IT',
    semester: 'SEM 7',
    academic_year: '2026-2027',
    status: 'active'
  });

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/forms');
      if (res.data.success) {
        setForms(res.data.forms);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/forms', formData);
      setShowModal(false);
      setFormData({
        title: '',
        course: 'IMsc IT',
        semester: 'SEM 7',
        academic_year: '2026-2027',
        status: 'active'
      });
      fetchForms();
    } catch (err) {
      alert('Failed to create form.');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await API.put(`/admin/forms/${id}/status`, { status: newStatus });
      fetchForms();
    } catch (err) {
      alert('Failed to update form status.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h2 className="fw-bold text-light mb-1">
            <i className="bi bi-file-earmark-plus me-2 text-warning"></i> Manage Feedback Forms
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
            Create semester evaluation forms, set title metadata, and toggle active status
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-gold py-2 px-3 fw-bold">
          <i className="bi bi-plus-lg me-1"></i> Create Feedback Form
        </button>
      </div>

      <div className="portal-card p-0 overflow-hidden">
        <table className="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>Form Title</th>
              <th>Course / Program</th>
              <th>Semester</th>
              <th>Academic Session</th>
              <th>Status</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4">Loading forms...</td></tr>
            ) : forms.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-muted">No feedback forms configured.</td></tr>
            ) : (
              forms.map(f => (
                <tr key={f.id}>
                  <td className="fw-bold text-light">{f.title}</td>
                  <td><span className="badge bg-dark border border-secondary text-light">{f.course}</span></td>
                  <td><span className="badge bg-warning text-dark">{f.semester}</span></td>
                  <td>{f.academic_year}</td>
                  <td>
                    <span className={`badge ${f.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="text-end px-4">
                    <button
                      onClick={() => toggleStatus(f.id, f.status)}
                      className={`btn btn-sm ${f.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                    >
                      {f.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light border-warning">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-warning fw-bold">Create Feedback Form</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-light">Form Title *</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-light border-secondary"
                      placeholder="e.g. Student Feedback (SEM 7) 2025-26"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                    <div className="row g-2">
                      <div className="col-6 mb-3">
                        <label className="form-label text-light">Course</label>
                        <select className="form-select bg-dark text-warning border-warning fw-bold" value={formData.course} disabled>
                          <option value="IMsc IT">IMsc IT</option>
                        </select>
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label text-light">Semester</label>
                        <select className="form-select bg-dark text-light border-secondary" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>
                          <option value="SEM 1">Sem 1</option>
                          <option value="SEM 3">Sem 3</option>
                          <option value="SEM 5">Sem 5</option>
                          <option value="SEM 7">Sem 7</option>
                          <option value="SEM 9">Sem 9</option>
                        </select>
                      </div>
                    </div>
                  <div className="mb-3">
                    <label className="form-label text-light">Academic Year</label>
                    <select className="form-select bg-dark text-light border-secondary" value={formData.academic_year} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}>
                      <option value="2026-2027">2026-2027</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold">Publish Form</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageForms;
