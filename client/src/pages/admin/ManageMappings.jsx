import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const ManageMappings = () => {
  const [mappings, setMappings] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ subject_id: '', faculty_id: '', semester: 'SEM 7', academic_year: '2026-2027' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mapRes, subRes, facRes] = await Promise.all([
        API.get('/admin/mappings'),
        API.get('/admin/subjects'),
        API.get('/admin/faculty')
      ]);

      if (mapRes.data.success) setMappings(mapRes.data.mappings);
      if (subRes.data.success) setSubjects(subRes.data.subjects);
      if (facRes.data.success) setFaculty(facRes.data.faculty);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject_id || !formData.faculty_id) {
      alert('Please select both a subject and a faculty member.');
      return;
    }

    try {
      await API.post('/admin/mappings', formData);
      setShowModal(false);
      setFormData({ subject_id: '', faculty_id: '', semester: 'SEM 7', academic_year: '2025-26' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create mapping.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this Subject-Faculty assignment?')) {
      try {
        await API.delete(`/admin/mappings/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete mapping.');
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h2 className="fw-bold text-light mb-1">
            <i className="bi bi-diagram-3 me-2 text-warning"></i> Subject-Faculty Assignments
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
            Assign professors to course subjects for specific semesters and academic sessions
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-gold py-2 px-3 fw-bold">
          <i className="bi bi-plus-lg me-1"></i> New Subject-Faculty Mapping
        </button>
      </div>

      <div className="portal-card p-0 overflow-hidden">
        <table className="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>Subject Course</th>
              <th>Assigned Faculty</th>
              <th>Semester</th>
              <th>Academic Year</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Loading assignments...</td></tr>
            ) : mappings.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4 text-muted">No mappings configured.</td></tr>
            ) : (
              mappings.map(m => (
                <tr key={m.id}>
                  <td className="fw-bold text-light">
                    {m.subject_name} {m.subject_code ? `(${m.subject_code})` : ''}
                  </td>
                  <td>
                    <span className="text-warning font-semibold">
                      <i className="bi bi-person-workspace me-1"></i> {m.faculty_name}
                    </span>
                  </td>
                  <td><span className="badge bg-warning text-dark">{m.semester}</span></td>
                  <td>{m.academic_year}</td>
                  <td className="text-end px-4">
                    <button onClick={() => handleDelete(m.id)} className="btn btn-outline-danger btn-sm">
                      <i className="bi bi-trash-fill me-1"></i> Remove
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
                <h5 className="modal-title text-warning fw-bold">Create Subject-Faculty Assignment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-light">Select Subject *</label>
                    <select className="form-select bg-dark text-light border-secondary" value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} required>
                      <option value="">-- Choose Subject --</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.subject_name} ({s.semester} - {s.academic_year})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-light">Select Assigned Faculty *</label>
                    <select className="form-select bg-dark text-light border-secondary" value={formData.faculty_id} onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })} required>
                      <option value="">-- Choose Faculty Member --</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>{f.faculty_name || f.name} ({f.department})</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-2">
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
                    <div className="col-6 mb-3">
                      <label className="form-label text-light">Academic Year</label>
                      <select className="form-select bg-dark text-light border-secondary" value={formData.academic_year} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}>
                        <option value="2026-2027">2026-2027</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold">Assign Faculty</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMappings;
