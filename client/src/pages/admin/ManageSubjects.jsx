import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ subject_name: '', subject_code: '', semester: 'SEM 7', academic_year: '2026-2027' });
  const [editId, setEditId] = useState(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/subjects');
      if (res.data.success) {
        setSubjects(res.data.subjects);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/admin/subjects/${editId}`, { ...formData, status: 'active' });
      } else {
        await API.post('/admin/subjects', formData);
      }
      setShowModal(false);
      setFormData({ subject_name: '', subject_code: '', semester: 'SEM 7', academic_year: '2025-26' });
      setEditId(null);
      fetchSubjects();
    } catch (err) {
      alert('Failed to save subject.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await API.delete(`/admin/subjects/${id}`);
        fetchSubjects();
      } catch (err) {
        alert('Failed to delete subject.');
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h2 className="fw-bold text-light mb-1">
            <i className="bi bi-journal-text me-2 text-warning"></i> Manage Academic Subjects
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
            Configure subjects, course codes, semesters, and academic sessions
          </p>
        </div>
        <button onClick={() => { setEditId(null); setFormData({ subject_name: '', subject_code: '', semester: 'SEM 7', academic_year: '2025-26' }); setShowModal(true); }} className="btn btn-gold py-2 px-3 fw-bold">
          <i className="bi bi-plus-lg me-1"></i> Add New Subject
        </button>
      </div>

      <div className="portal-card p-0 overflow-hidden">
        <table className="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject Name</th>
              <th>Semester</th>
              <th>Academic Year</th>
              <th>Status</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4">Loading subjects...</td></tr>
            ) : subjects.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-muted">No subjects found.</td></tr>
            ) : (
              subjects.map(s => (
                <tr key={s.id}>
                  <td><span className="font-monospace text-warning">{s.subject_code || 'N/A'}</span></td>
                  <td className="fw-bold text-light">{s.subject_name}</td>
                  <td><span className="badge bg-warning text-dark">{s.semester}</span></td>
                  <td>{s.academic_year}</td>
                  <td><span className="badge bg-success">{s.status}</span></td>
                  <td className="text-end px-4">
                    <button onClick={() => { setEditId(s.id); setFormData({ subject_name: s.subject_name, subject_code: s.subject_code || '', semester: s.semester, academic_year: s.academic_year }); setShowModal(true); }} className="btn btn-outline-warning btn-sm me-2">
                      <i className="bi bi-pencil-fill"></i> Edit
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="btn btn-outline-danger btn-sm">
                      <i className="bi bi-trash-fill"></i>
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
                <h5 className="modal-title text-warning fw-bold">{editId ? 'Edit Subject' : 'Add New Subject'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-light">Subject Name *</label>
                    <input type="text" className="form-control bg-dark text-light border-secondary" value={formData.subject_name} onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-light">Subject Code</label>
                    <input type="text" className="form-control bg-dark text-light border-secondary" placeholder="e.g. IT701 or IT901" value={formData.subject_code} onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })} />
                  </div>
                  <div className="row g-2">
                    <div className="col-6 mb-3">
                      <label className="form-label text-light">Semester *</label>
                      <select className="form-select bg-dark text-light border-secondary" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>
                        <option value="SEM 7">SEM 7</option>
                        <option value="SEM 9">SEM 9</option>
                        <option value="SEM 1">SEM 1</option>
                        <option value="SEM 3">SEM 3</option>
                        <option value="SEM 5">SEM 5</option>
                      </select>
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label text-light">Academic Year *</label>
                      <select className="form-select bg-dark text-light border-secondary" value={formData.academic_year} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}>
                        <option value="2026-2027">2026-2027</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold">Save Subject</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSubjects;
