import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/students?search=${encodeURIComponent(search)}&semester=${semester}`);
      if (res.data.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, semester]);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await API.put(`/admin/students/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchStudents();
      }
    } catch (err) {
      alert('Failed to update student status.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h2 className="fw-bold text-light mb-1">
            <i className="bi bi-people-fill me-2 text-warning"></i> Manage Students
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
            View registered student profiles, submission counts, and control account activation status
          </p>
        </div>
      </div>

      <div className="portal-card p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-8">
            <input
              type="text"
              className="form-control bg-dark text-light border-secondary"
              placeholder="Search by student name, enrollment no, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
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
        </div>
      </div>

      <div className="portal-card p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-dark-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Enrollment No.</th>
                <th>Email Address</th>
                <th>Course / Semester</th>
                <th>Submissions</th>
                <th>Account Status</th>
                <th className="text-end px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">Loading student directory...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">No student records found.</td>
                </tr>
              ) : (
                students.map(st => (
                  <tr key={st.id}>
                    <td className="fw-bold text-light">{st.name}</td>
                    <td><span className="font-monospace text-warning">{st.enrollment_number}</span></td>
                    <td>{st.email}</td>
                    <td>
                      <span className="badge bg-dark border border-secondary">{st.course}</span>
                      <span className="badge bg-warning text-dark ms-1">{st.semester}</span>
                    </td>
                    <td>
                      <span className={`badge ${st.submissions_count > 0 ? 'bg-success' : 'bg-secondary'} px-2 py-1`}>
                        {st.submissions_count} Submitted
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${st.status === 'active' ? 'bg-success' : 'bg-danger'} px-2 py-1`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <button
                        onClick={() => toggleStatus(st.id, st.status)}
                        className={`btn btn-sm ${st.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      >
                        {st.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;
