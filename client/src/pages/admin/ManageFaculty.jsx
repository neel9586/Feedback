import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', department: 'Information Technology' });
  const [editId, setEditId] = useState(null);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/faculty');
      if (res.data.success) {
        setFaculty(res.data.faculty);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/admin/faculty/${editId}`, { ...formData, status: 'active' });
      } else {
        await API.post('/admin/faculty', formData);
      }
      setShowModal(false);
      setFormData({ name: '', email: '', department: 'Information Technology' });
      setEditId(null);
      fetchFaculty();
    } catch (err) {
      alert('Failed to save faculty member.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await API.delete(`/admin/faculty/${id}`);
        fetchFaculty();
      } catch (err) {
        alert('Failed to delete faculty.');
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h2 className="fw-bold text-light mb-1">
            <i className="bi bi-person-workspace me-2 text-warning"></i> Manage Faculty Members
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
            Maintain professor directory, departmental assignments, and contact records
          </p>
        </div>
        <button onClick={() => { setEditId(null); setFormData({ name: '', email: '', department: 'Information Technology' }); setShowModal(true); }} className="btn btn-gold py-2 px-3 fw-bold">
          <i className="bi bi-person-plus-fill me-1"></i> Add Faculty Member
        </button>
      </div>

      <div className="portal-card p-0 overflow-hidden">
        <table className="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>Faculty Name</th>
              <th>Email Address</th>
              <th>Department</th>
              <th>Status</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Loading faculty directory...</td></tr>
            ) : faculty.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4 text-muted">No faculty members found.</td></tr>
            ) : (
              faculty.map(f => (
                <tr key={f.id}>
                  <td className="fw-bold text-light">{f.faculty_name || f.name}</td>
                  <td>{f.email || 'N/A'}</td>
                  <td><span className="badge bg-dark border border-secondary text-light">{f.department}</span></td>
                  <td><span className="badge bg-success">{f.status}</span></td>
                  <td className="text-end px-4">
                    <button onClick={() => { setEditId(f.id); setFormData({ name: f.faculty_name || f.name, email: f.email || '', department: f.department || 'Information Technology' }); setShowModal(true); }} className="btn btn-outline-warning btn-sm me-2">
                      <i className="bi bi-pencil-fill"></i> Edit
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="btn btn-outline-danger btn-sm">
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
                <h5 className="modal-title text-warning fw-bold">{editId ? 'Edit Faculty' : 'Add New Faculty Member'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-light">Faculty Name *</label>
                    <input type="text" className="form-control bg-dark text-light border-secondary" placeholder="e.g. Dr. Ronak Vadiwala" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-light">Email Address</label>
                    <input type="email" className="form-control bg-dark text-light border-secondary" placeholder="faculty@college.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-light">Department *</label>
                    <input type="text" className="form-control bg-dark text-light border-secondary" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold">Save Faculty</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFaculty;
