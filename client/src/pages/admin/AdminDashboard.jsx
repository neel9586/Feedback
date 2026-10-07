import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('ALL');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/admin/dashboard-stats?semester=${semesterFilter}`);
        if (res.data.success) {
          setStatsData(res.data);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
        setError('Failed to load dashboard analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [semesterFilter]);

  if (loading && !statsData) {
    return (
      <div className="container py-5 text-center text-light">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p className="text-muted">Loading administrative analytics & charts...</p>
      </div>
    );
  }

  const { stats, charts } = statsData || { stats: {}, charts: {} };

  // Chart 1: Subject-wise Ratings
  const subjectChartData = {
    labels: charts?.subjectRatings?.map(s => s.name) || [],
    datasets: [
      {
        label: 'Average Rating (1-5)',
        data: charts?.subjectRatings?.map(s => s.avgRating) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.75)',
        borderColor: '#F59E0B',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // Chart 2: Faculty-wise Ratings
  const facultyChartData = {
    labels: charts?.facultyRatings?.map(f => f.name) || [],
    datasets: [
      {
        label: 'Faculty Average Rating',
        data: charts?.facultyRatings?.map(f => f.avgRating) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // Chart 3: Rating Distribution (1-5 Stars)
  const dist = charts?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const distributionChartData = {
    labels: ['1 Star (Very Poor)', '2 Stars (Poor)', '3 Stars (Good)', '4 Stars (Very Good)', '5 Stars (Excellent)'],
    datasets: [
      {
        data: [dist[1], dist[2], dist[3], dist[4], dist[5]],
        backgroundColor: [
          '#EF4444',
          '#F97316',
          '#EAB308',
          '#3B82F6',
          '#10B981'
        ],
        borderWidth: 1,
        borderColor: '#1E293B'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94A3B8' } },
      tooltip: { backgroundColor: '#0F172A', titleColor: '#F8FAFC', bodyColor: '#F59E0B' }
    },
    scales: {
      y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 5 },
      x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header & Filter */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom border-secondary gap-3">
        <div>
          <h2 className="fw-bold text-light mb-1">
            <i className="bi bi-pie-chart-fill me-2 text-warning"></i> Admin Analytics Dashboard
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
            Real-time evaluation analytics, subject ratings, and faculty performance distribution
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <label className="text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Semester Filter:</label>
          <select
            className="form-select bg-dark text-light border-secondary"
            style={{ width: '180px' }}
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
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

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* 6 Summary Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-2">
          <div className="stat-card">
            <div className="stat-icon blue"><i className="bi bi-people-fill"></i></div>
            <div>
              <div className="stat-value text-light">{stats?.totalStudents || 0}</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="stat-card">
            <div className="stat-icon green"><i className="bi bi-check2-circle"></i></div>
            <div>
              <div className="stat-value text-light">{stats?.totalSubmissions || 0}</div>
              <div className="stat-label">Submissions</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="stat-card">
            <div className="stat-icon gold"><i className="bi bi-hourglass-split"></i></div>
            <div>
              <div className="stat-value text-light">{stats?.pendingFeedback || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="stat-card">
            <div className="stat-icon purple"><i className="bi bi-star-fill"></i></div>
            <div>
              <div className="stat-value text-warning">{stats?.overallAvg || '0.00'}</div>
              <div className="stat-label">Overall Rating</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="stat-card">
            <div className="stat-icon blue"><i className="bi bi-journal-text"></i></div>
            <div>
              <div className="stat-value text-light">{stats?.totalSubjects || 0}</div>
              <div className="stat-label">Subjects</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-2">
          <div className="stat-card">
            <div className="stat-icon green"><i className="bi bi-person-badge"></i></div>
            <div>
              <div className="stat-value text-light">{stats?.totalFaculty || 0}</div>
              <div className="stat-label">Faculty</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="row g-4">
        {/* Subject-Wise Ratings */}
        <div className="col-lg-6">
          <div className="portal-card p-4 h-100">
            <h5 className="fw-bold text-light mb-3">
              <i className="bi bi-bar-chart-fill me-2 text-warning"></i> Subject-wise Average Ratings
            </h5>
            <div style={{ height: '300px' }}>
              {charts?.subjectRatings?.length > 0 ? (
                <Bar data={subjectChartData} options={chartOptions} />
              ) : (
                <div className="text-center py-5 text-muted">No subject feedback data available yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Faculty-Wise Ratings */}
        <div className="col-lg-6">
          <div className="portal-card p-4 h-100">
            <h5 className="fw-bold text-light mb-3">
              <i className="bi bi-person-chart me-2 text-info"></i> Faculty-wise Average Ratings
            </h5>
            <div style={{ height: '300px' }}>
              {charts?.facultyRatings?.length > 0 ? (
                <Bar data={facultyChartData} options={chartOptions} />
              ) : (
                <div className="text-center py-5 text-muted">No faculty feedback data available yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Overall Rating Distribution 1-5 Stars */}
        <div className="col-lg-6">
          <div className="portal-card p-4 h-100">
            <h5 className="fw-bold text-light mb-3">
              <i className="bi bi-pie-chart me-2 text-success"></i> Rating Distribution (1 to 5 Scale)
            </h5>
            <div style={{ height: '280px' }} className="d-flex justify-content-center">
              <Doughnut
                data={distributionChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { color: '#94A3B8' } } }
                }}
              />
            </div>
          </div>
        </div>

        {/* Key Metrics / Highest & Lowest Ratings */}
        <div className="col-lg-6">
          <div className="portal-card p-4 h-100">
            <h5 className="fw-bold text-light mb-3">
              <i className="bi bi-award-fill me-2 text-warning"></i> Executive Feedback Insights
            </h5>
            <div className="d-flex flex-column gap-3">
              {charts?.facultyRatings?.length > 0 && (
                <>
                  <div className="p-3 bg-dark rounded border border-secondary d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-muted d-block" style={{ fontSize: '0.78rem' }}>HIGHEST RATED FACULTY</span>
                      <strong className="text-success fs-6">{charts.facultyRatings[0]?.name}</strong>
                    </div>
                    <span className="badge bg-success fs-6">{charts.facultyRatings[0]?.avgRating} / 5.0</span>
                  </div>

                  <div className="p-3 bg-dark rounded border border-secondary d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-muted d-block" style={{ fontSize: '0.78rem' }}>LOWEST RATED FACULTY</span>
                      <strong className="text-danger fs-6">{charts.facultyRatings[charts.facultyRatings.length - 1]?.name}</strong>
                    </div>
                    <span className="badge bg-danger fs-6">{charts.facultyRatings[charts.facultyRatings.length - 1]?.avgRating} / 5.0</span>
                  </div>
                </>
              )}

              {charts?.subjectRatings?.length > 0 && (
                <div className="p-3 bg-dark rounded border border-secondary d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted d-block" style={{ fontSize: '0.78rem' }}>HIGHEST RATED SUBJECT</span>
                    <strong className="text-warning fs-6">{charts.subjectRatings[0]?.name}</strong>
                  </div>
                  <span className="badge bg-warning text-dark fs-6">{charts.subjectRatings[0]?.avgRating} / 5.0</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
