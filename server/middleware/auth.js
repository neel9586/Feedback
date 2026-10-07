const jwt = require('jsonwebtoken');
const { query } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_student_feedback_2026_x89a';

// Authenticate JWT Token
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from DB to ensure status is active
    const result = await query('SELECT id, name, email, enrollment_number, role, course, semester, academic_year, status FROM users WHERE id = ?', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = result.rows[0];

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};

// Require Student Role
const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access Denied: Student authorization required.' });
  }
  next();
};

// Require Admin Role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Administrative privileges required.' });
  }
  next();
};

module.exports = {
  authenticateUser,
  requireStudent,
  requireAdmin,
  JWT_SECRET
};
