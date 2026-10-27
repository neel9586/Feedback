import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import Unauthorized from './pages/common/Unauthorized';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import FeedbackForm from './pages/student/FeedbackForm';
import SubmissionSuccess from './pages/student/SubmissionSuccess';
import Profile from './pages/student/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FeedbackList from './pages/admin/FeedbackList';
import ManageStudents from './pages/admin/ManageStudents';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageMappings from './pages/admin/ManageMappings';
import ManageForms from './pages/admin/ManageForms';
import ExcelUpload from './pages/admin/ExcelUpload';
import UploadAnalysis from './pages/admin/UploadAnalysis';

const HomeRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-light">
        <div className="spinner-border text-warning" role="status"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-obsidian">
      <Navbar />

      <main className="flex-grow-1 d-flex flex-column">
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/feedback"
            element={
              <ProtectedRoute>
                <FeedbackForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/success"
            element={
              <ProtectedRoute>
                <SubmissionSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <AdminRoute>
                <FeedbackList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <AdminRoute>
                <ManageStudents />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <AdminRoute>
                <ManageSubjects />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/faculty"
            element={
              <AdminRoute>
                <ManageFaculty />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/mappings"
            element={
              <AdminRoute>
                <ManageMappings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/forms"
            element={
              <AdminRoute>
                <ManageForms />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/upload-excel"
            element={
              <AdminRoute>
                <ExcelUpload />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/upload-analysis"
            element={
              <AdminRoute>
                <UploadAnalysis />
              </AdminRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
