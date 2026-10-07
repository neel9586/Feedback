import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container py-4 flex-grow-1" style={{ maxWidth: '720px' }}>
      <div className="portal-card p-4 p-md-5">
        <div className="d-flex align-items-center gap-3 mb-4 border-bottom border-secondary pb-3">
          <div className="stat-icon gold" style={{ width: '60px', height: '60px', fontSize: '1.8rem' }}>
            <i className="bi bi-person-bounding-box"></i>
          </div>
          <div>
            <h3 className="fw-bold text-light mb-0">{user?.name}</h3>
            <span className="badge bg-warning text-dark font-monospace">{user?.enrollment_number}</span>
          </div>
        </div>

        <div className="row g-3 text-light">
          <div className="col-md-6">
            <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>EMAIL ADDRESS</label>
            <div className="p-2.5 bg-dark rounded border border-secondary">{user?.email}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>COURSE / PROGRAM</label>
            <div className="p-2.5 bg-dark rounded border border-secondary">{user?.course}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>SEMESTER</label>
            <div className="p-2.5 bg-dark rounded border border-secondary text-warning fw-bold">{user?.semester}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>ACADEMIC YEAR</label>
            <div className="p-2.5 bg-dark rounded border border-secondary">{user?.academic_year}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>ACCOUNT ROLE</label>
            <div className="p-2.5 bg-dark rounded border border-secondary text-capitalize">{user?.role}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted d-block" style={{ fontSize: '0.78rem' }}>STATUS</label>
            <div className="p-2.5 bg-dark rounded border border-secondary text-success fw-bold">Active & Verified</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
