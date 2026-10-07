const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateUser, requireStudent } = require('../middleware/auth');

// All student routes require student authentication
router.use(authenticateUser, requireStudent);

router.get('/dashboard-status', studentController.getDashboardStatus);
router.get('/active-form', studentController.getActiveForm);
router.post('/submit-feedback', studentController.submitFeedback);

module.exports = router;
