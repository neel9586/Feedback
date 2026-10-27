import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { AuthContext } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
const BAR_COLOR = '#f59e0b';
const BAR_COLOR2 = '#6366f1';
const DIST_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1e1e3a', border: '1px solid #f59e0b', borderRadius: 8,
        padding: '8px 14px', fontSize: '0.82rem'
      }}>
        <div className="fw-semibold text-warning mb-1">{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>
            {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StarRating = ({ value }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.45;
  return (
    <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <i key={i} className="bi bi-star-fill"></i>;
        if (i === full && half) return <i key={i} className="bi bi-star-half"></i>;
        return <i key={i} className="bi bi-star" style={{ opacity: 0.3 }}></i>;
      })}
      <span className="ms-1 text-light fw-semibold" style={{ fontSize: '0.8rem' }}>{value.toFixed(2)}</span>
    </span>
  );
};

const EmptyState = ({ message }) => (
  <div className="text-center py-5 text-muted">
    <i className="bi bi-bar-chart-line fs-1 d-block mb-2 opacity-25"></i>
    <div>{message}</div>
  </div>
);

const UploadAnalysis = () => {
  const { token } = useContext(AuthContext);
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    semester: 'ALL',
    academic_year: 'ALL',
    faculty_name: 'ALL',
    subject_name: 'ALL',
    batch_id: 'ALL'
  });

  const fetchAnalysis = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => { if (v && v !== 'ALL') params.append(k, v); });
      const res = await fetch(`${API}/api/admin/upload-analysis?${params}`, { headers: authHeaders });
      const json = await res.json();
      if (json.success) setData(json);
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAnalysis(filters); }, []);

  const applyFilters = () => fetchAnalysis(filters);
  const resetFilters = () => {
    const reset = { semester: 'ALL', academic_year: 'ALL', faculty_name: 'ALL', subject_name: 'ALL', batch_id: 'ALL' };
    setFilters(reset);
    fetchAnalysis(reset);
  };

  const distData = data ? Object.entries(data.charts?.ratingDistribution || {}).map(([k, v]) => ({
    name: `⭐ ${k}`, rating: Number(k), count: v
  })) : [];

  const opts = data?.filterOptions || {};

  return (
    <div className="container-fluid p-4" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-warning mb-1">
            <i className="bi bi-bar-chart-line me-2"></i>Upload Feedback Analysis
          </h2>
          <p className="text-muted mb-0">Charts and tables generated from manually uploaded feedback data.</p>
        </div>
        <Link to="/admin/upload-excel" className="btn btn-outline-warning btn-sm">
          <i className="bi bi-cloud-upload me-1"></i>Upload More Data
        </Link>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            {[
              { label: 'Semester', key: 'semester', opts: opts.semesters || [] },
              { label: 'Academic Year', key: 'academic_year', opts: opts.academicYears || [] },
              { label: 'Faculty', key: 'faculty_name', opts: opts.faculty || [] },
              { label: 'Subject', key: 'subject_name', opts: opts.subjects || [] }
            ].map(({ label, key, opts: o }) => (
              <div className="col-6 col-md-3 col-lg-2" key={key}>
                <label className="form-label text-muted small mb-1">{label}</label>
                <select
                  className="form-select form-select-sm bg-dark text-light border-secondary"
                  value={filters[key]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                >
                  <option value="ALL">All</option>
                  {o.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label text-muted small mb-1">Upload Batch</label>
              <select
                className="form-select form-select-sm bg-dark text-light border-secondary"
                value={filters.batch_id}
                onChange={e => setFilters(f => ({ ...f, batch_id: e.target.value }))}
              >
                <option value="ALL">All Batches</option>
                {(opts.batches || []).map(b => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.upload_filename} ({new Date(b.uploaded_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-auto">
              <button className="btn btn-warning btn-sm w-100" onClick={applyFilters}>
                <i className="bi bi-funnel me-1"></i>Apply
              </button>
            </div>
            <div className="col-6 col-md-auto">
              <button className="btn btn-outline-secondary btn-sm w-100" onClick={resetFilters}>
                <i className="bi bi-x-lg me-1"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" style={{ width: '3rem', height: '3rem' }}></div>
          <div className="text-muted mt-3">Crunching your data…</div>
        </div>
      ) : !data || data.stats?.totalRows === 0 ? (
        <div className="card border-0 shadow-sm text-center p-5" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
          <i className="bi bi-inbox fs-1 text-warning d-block mb-3"></i>
          <h5 className="text-light">No uploaded feedback data found</h5>
          <p className="text-muted">Upload an Excel file first to see analysis here.</p>
          <Link to="/admin/upload-excel" className="btn btn-warning mt-2">
            <i className="bi bi-cloud-upload me-2"></i>Go to Upload
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            {[
              { icon: 'star-fill', color: '#f59e0b', label: 'Overall Avg Rating', value: `${data.stats.avgRating} / 5` },
              { icon: 'collection', color: '#6366f1', label: 'Total Records', value: data.stats.totalRows.toLocaleString() },
              { icon: 'person-workspace', color: '#22c55e', label: 'Faculty', value: data.stats.totalFaculty },
              { icon: 'journal-text', color: '#06b6d4', label: 'Subjects', value: data.stats.totalSubjects },
              { icon: 'layers', color: '#f97316', label: 'Semesters', value: data.stats.totalSemesters }
            ].map((s, i) => (
              <div className="col-6 col-md-4 col-lg" key={i}>
                <div className="card border-0 shadow-sm h-100" style={{ background: 'var(--card-bg, #1a1a2e)', borderLeft: `3px solid ${s.color}` }}>
                  <div className="card-body p-3 d-flex align-items-center gap-3">
                    <i className={`bi bi-${s.icon} fs-4`} style={{ color: s.color }}></i>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{s.label}</div>
                      <div className="fw-bold text-light fs-5">{s.value}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Faculty-wise Chart + Table */}
          <div className="card border-0 shadow-sm mb-4" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
            <div className="card-body p-4">
              <h5 className="fw-semibold text-warning mb-3">
                <i className="bi bi-person-workspace me-2"></i>Faculty-wise Average Rating
              </h5>
              {data.charts.facultyRatings.length === 0 ? <EmptyState message="No faculty data available" /> : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.charts.facultyRatings} margin={{ top: 10, right: 20, left: -10, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgRating" name="Avg Rating" fill={BAR_COLOR} radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="avgRating" position="top" style={{ fill: '#f59e0b', fontSize: 10 }} formatter={v => v.toFixed(2)} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="table-responsive mt-3">
                    <table className="table table-dark table-hover table-sm mb-0" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th className="text-warning">#</th>
                          <th className="text-warning">Faculty Name</th>
                          <th className="text-warning text-center">Avg Rating</th>
                          <th className="text-warning text-center">Total Ratings</th>
                          <th className="text-warning">Semesters</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.charts.facultyRatings.map((r, i) => (
                          <tr key={i}>
                            <td className="text-muted">{i + 1}</td>
                            <td className="fw-semibold text-light">{r.name}</td>
                            <td className="text-center"><StarRating value={r.avgRating} /></td>
                            <td className="text-center"><span className="badge bg-secondary">{r.totalRatings}</span></td>
                            <td className="text-muted" style={{ fontSize: '0.75rem' }}>{r.semesters}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Subject-wise Chart + Table */}
          <div className="card border-0 shadow-sm mb-4" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
            <div className="card-body p-4">
              <h5 className="fw-semibold text-warning mb-3">
                <i className="bi bi-journal-text me-2"></i>Subject-wise Average Rating
              </h5>
              {data.charts.subjectRatings.length === 0 ? <EmptyState message="No subject data available" /> : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.charts.subjectRatings} margin={{ top: 10, right: 20, left: -10, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgRating" name="Avg Rating" fill={BAR_COLOR2} radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="avgRating" position="top" style={{ fill: '#a5b4fc', fontSize: 10 }} formatter={v => v.toFixed(2)} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="table-responsive mt-3">
                    <table className="table table-dark table-hover table-sm mb-0" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th className="text-warning">#</th>
                          <th className="text-warning">Subject</th>
                          <th className="text-warning">Code</th>
                          <th className="text-warning text-center">Avg Rating</th>
                          <th className="text-warning text-center">Total Ratings</th>
                          <th className="text-warning">Semesters</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.charts.subjectRatings.map((r, i) => (
                          <tr key={i}>
                            <td className="text-muted">{i + 1}</td>
                            <td className="fw-semibold text-light">{r.name}</td>
                            <td className="text-muted">{r.code || '—'}</td>
                            <td className="text-center"><StarRating value={r.avgRating} /></td>
                            <td className="text-center"><span className="badge bg-secondary">{r.totalRatings}</span></td>
                            <td className="text-muted" style={{ fontSize: '0.75rem' }}>{r.semesters}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Semester-wise + Rating Distribution */}
          <div className="row g-4 mb-4">
            {/* Semester-wise */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
                <div className="card-body p-4">
                  <h5 className="fw-semibold text-warning mb-3">
                    <i className="bi bi-layers me-2"></i>Semester-wise Average Rating
                  </h5>
                  {data.charts.semesterRatings.length === 0 ? <EmptyState message="No semester data available" /> : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.charts.semesterRatings} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                          <XAxis dataKey="semester" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                          <YAxis domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="avgRating" name="Avg Rating" fill="#22c55e" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="avgRating" position="top" style={{ fill: '#86efac', fontSize: 11 }} formatter={v => v.toFixed(2)} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="table-responsive mt-3">
                        <table className="table table-dark table-sm mb-0" style={{ fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th className="text-warning">Semester</th>
                              <th className="text-warning text-center">Avg</th>
                              <th className="text-warning text-center">Ratings</th>
                              <th className="text-warning text-center">Faculty</th>
                              <th className="text-warning text-center">Subjects</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.charts.semesterRatings.map((r, i) => (
                              <tr key={i}>
                                <td className="fw-semibold text-light">{r.semester}</td>
                                <td className="text-center"><StarRating value={r.avgRating} /></td>
                                <td className="text-center"><span className="badge bg-secondary">{r.totalRatings}</span></td>
                                <td className="text-center"><span className="badge bg-info">{r.facultyCount}</span></td>
                                <td className="text-center"><span className="badge bg-primary">{r.subjectCount}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Rating Distribution Pie */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
                <div className="card-body p-4">
                  <h5 className="fw-semibold text-warning mb-3">
                    <i className="bi bi-pie-chart me-2"></i>Rating Distribution
                  </h5>
                  {distData.every(d => d.count === 0) ? <EmptyState message="No rating data available" /> : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={distData.filter(d => d.count > 0)}
                            dataKey="count"
                            nameKey="name"
                            cx="50%" cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={false}
                          >
                            {distData.filter(d => d.count > 0).map((entry) => (
                              <Cell key={entry.rating} fill={DIST_COLORS[entry.rating - 1]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => [`${val} ratings`, '']} />
                          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="row g-1 mt-2">
                        {distData.map((d, i) => (
                          <div className="col-4 col-sm" key={i}>
                            <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <div className="fw-bold" style={{ color: DIST_COLORS[i], fontSize: '1.1rem' }}>{d.count}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>⭐ {i + 1} Star{i !== 0 ? 's' : ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadAnalysis;
