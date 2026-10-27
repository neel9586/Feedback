import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { AuthContext } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ExcelUpload = () => {
  const { token } = useContext(AuthContext);

  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch upload history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/upload-history`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setHistory(data.batches || []);
    } catch (e) { /* silent */ }
    setHistoryLoading(false);
  }, [token]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Parse file client-side for preview
  const parseFile = (f) => {
    setFile(f);
    setUploadResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        setPreviewHeaders(headers);
        setPreviewRows(rows.slice(0, 10));
      } catch {
        setPreviewHeaders([]);
        setPreviewRows([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) parseFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API}/api/admin/upload-excel`, {
        method: 'POST',
        headers: authHeaders,
        body: form
      });
      const data = await res.json();
      setUploadResult(data);
      if (data.success) {
        setFile(null);
        setPreviewRows([]);
        setPreviewHeaders([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchHistory();
      }
    } catch (err) {
      setUploadResult({ success: false, message: 'Network error. Please try again.' });
    }
    setUploading(false);
  };

  const handleDelete = async (batchId) => {
    if (!window.confirm('Delete this upload batch and all its data?')) return;
    setDeletingId(batchId);
    try {
      await fetch(`${API}/api/admin/upload-batch/${batchId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      fetchHistory();
    } catch { /* silent */ }
    setDeletingId(null);
  };

  // Generate & download sample template
  const downloadTemplate = () => {
    const templateData = [
      {
        'Student Name': 'Neel Shah',
        'Enrollment Number': '23IT001',
        'Semester': 'SEM 7',
        'Academic Year': '2026-2027',
        'Subject Name': 'Python Prog.-2',
        'Subject Code': 'IT701',
        'Faculty Name': 'Prof. Leena Chaudhari',
        'Question': 'Has the teacher covered entire syllabus?',
        'Rating': 4
      },
      {
        'Student Name': 'Neel Shah',
        'Enrollment Number': '23IT001',
        'Semester': 'SEM 7',
        'Academic Year': '2026-2027',
        'Subject Name': 'Cyber Security',
        'Subject Code': 'IT702',
        'Faculty Name': 'Dr. Ronak Vadiwala',
        'Question': 'Effectiveness of Teacher in terms of Technical content',
        'Rating': 5
      }
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Feedback');
    XLSX.writeFile(wb, 'Feedback_Upload_Template.xlsx');
  };

  return (
    <div className="container-fluid p-4" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-warning mb-1">
            <i className="bi bi-file-earmark-spreadsheet me-2"></i>Upload Feedback Excel
          </h2>
          <p className="text-muted mb-0">Upload manually collected feedback data from Excel or CSV files.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={downloadTemplate}>
            <i className="bi bi-download me-1"></i>Download Template
          </button>
          <Link to="/admin/upload-analysis" className="btn btn-warning btn-sm">
            <i className="bi bi-bar-chart-line me-1"></i>View Analysis
          </Link>
        </div>
      </div>

      {/* Upload Section */}
      <div className="card border-0 shadow-sm mb-4" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
        <div className="card-body p-4">
          <h5 className="fw-semibold text-light mb-3">
            <i className="bi bi-cloud-upload me-2 text-warning"></i>Select File
          </h5>

          {/* Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? '#f59e0b' : '#4b5563'}`,
              borderRadius: 12,
              padding: '2.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.03)',
              transition: 'all 0.2s'
            }}
          >
            <i className="bi bi-file-earmark-excel fs-1 text-success mb-2 d-block"></i>
            {file ? (
              <div>
                <div className="fw-semibold text-warning">{file.name}</div>
                <div className="text-muted small mt-1">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div className="fw-semibold text-light">Drag & drop your Excel / CSV here</div>
                <div className="text-muted small mt-1">or click to browse — .xlsx, .xls, .csv — max 100 MB</div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="d-none"
            onChange={handleFileChange}
          />

          {/* Expected column format info */}
          <div className="alert alert-dark border-secondary mt-3 mb-0" style={{ fontSize: '0.82rem' }}>
            <i className="bi bi-info-circle me-1 text-warning"></i>
            <strong>Expected columns:</strong> Student Name, Enrollment Number, Semester, Academic Year, Subject Name, Subject Code, Faculty Name, Question, Rating (1–5)
            &nbsp;— column names are <em>flexible</em> (case-insensitive).
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {previewRows.length > 0 && (
        <div className="card border-0 shadow-sm mb-4" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-semibold text-light mb-0">
                <i className="bi bi-eye me-2 text-info"></i>Preview (first 10 rows)
              </h5>
              <button
                className="btn btn-warning px-4"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading…</>
                  : <><i className="bi bi-cloud-arrow-up me-2"></i>Upload Now</>}
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-dark table-sm table-hover mb-0" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    {previewHeaders.map(h => (
                      <th key={h} className="text-warning text-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {previewHeaders.map(h => (
                        <td key={h} className="text-nowrap">{String(row[h] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className={`alert ${uploadResult.success ? 'alert-success' : 'alert-danger'} mb-4`}>
          <i className={`bi bi-${uploadResult.success ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          <strong>{uploadResult.message}</strong>
          {uploadResult.success && (
            <div className="mt-2 small">
              ✅ <strong>{uploadResult.inserted}</strong> rows imported &nbsp;|&nbsp;
              ⚠️ <strong>{uploadResult.skipped}</strong> rows skipped
              {uploadResult.warnings?.length > 0 && (
                <ul className="mt-1 mb-0 ps-3">
                  {uploadResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload History */}
      <div className="card border-0 shadow-sm" style={{ background: 'var(--card-bg, #1a1a2e)' }}>
        <div className="card-body p-4">
          <h5 className="fw-semibold text-light mb-3">
            <i className="bi bi-clock-history me-2 text-warning"></i>Upload History
          </h5>
          {historyLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-warning"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>No uploads yet. Upload your first Excel file above.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th className="text-warning">File Name</th>
                    <th className="text-warning">Uploaded At</th>
                    <th className="text-warning text-center">Rows</th>
                    <th className="text-warning text-center">Faculty</th>
                    <th className="text-warning text-center">Subjects</th>
                    <th className="text-warning text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(b => (
                    <tr key={b.batch_id}>
                      <td>
                        <i className="bi bi-file-earmark-excel text-success me-2"></i>
                        <span className="text-light fw-semibold">{b.upload_filename}</span>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{b.batch_id}</div>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {new Date(b.uploaded_at).toLocaleString('en-IN')}
                      </td>
                      <td className="text-center"><span className="badge bg-info">{b.row_count}</span></td>
                      <td className="text-center"><span className="badge bg-secondary">{b.faculty_count}</span></td>
                      <td className="text-center"><span className="badge bg-secondary">{b.subject_count}</span></td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(b.batch_id)}
                          disabled={deletingId === b.batch_id}
                        >
                          {deletingId === b.batch_id
                            ? <span className="spinner-border spinner-border-sm"></span>
                            : <i className="bi bi-trash"></i>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelUpload;
