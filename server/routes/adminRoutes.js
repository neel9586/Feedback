const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// STRICT RBAC MANDATE: All admin routes enforce JWT authentication + admin role authorization
router.use(authenticateUser, requireAdmin);

// Dashboard Analytics & Charts
router.get('/dashboard-stats', adminController.getDashboardStats);

// Submissions Listing, Search & Filters
router.get('/submissions', adminController.getFeedbackSubmissions);
router.get('/submissions/:id', adminController.getSubmissionDetail);
router.delete('/submissions/:id', adminController.deleteSubmission);

// Export CSV
router.get('/export-csv', adminController.exportFeedbackCSV);

// Management: Students
router.get('/students', adminController.getStudents);
router.put('/students/:id/status', adminController.updateStudentStatus);

// Management: Subjects
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

// Management: Faculty
router.get('/faculty', adminController.getFaculty);
router.post('/faculty', adminController.createFaculty);
router.put('/faculty/:id', adminController.updateFaculty);
router.delete('/faculty/:id', adminController.deleteFaculty);

// Management: Subject-Faculty Mappings
router.get('/mappings', adminController.getSubjectFacultyMappings);
router.post('/mappings', adminController.createMapping);
router.delete('/mappings/:id', adminController.deleteMapping);

// Management: Feedback Forms
router.get('/forms', adminController.getFeedbackForms);
router.post('/forms', adminController.createForm);
router.put('/forms/:id/status', adminController.updateFormStatus);

// === Excel / Manual Upload Feature ===
router.post('/upload-excel', adminController.uploadMiddleware, adminController.uploadExcelFeedback);
router.get('/upload-history', adminController.getUploadHistory);
router.delete('/upload-batch/:batchId', adminController.deleteUploadedBatch);
router.get('/upload-analysis', adminController.getUploadedAnalysis);

module.exports = router;

