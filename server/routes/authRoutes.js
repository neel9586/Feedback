const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

router.post('/register', authController.registerStudent);
router.post('/login', authController.studentLogin);
router.post('/admin/login', authController.adminLogin);
router.get('/me', authenticateUser, authController.getProfile);

module.exports = router;
