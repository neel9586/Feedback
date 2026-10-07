const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

// Register Student
exports.registerStudent = async (req, res) => {
  try {
    const { name, email, enrollment_number, password, course, semester, division, academic_year } = req.body;

    if (!name || !email || !enrollment_number || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate email
    const existingEmail = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Check duplicate enrollment number
    const existingEnroll = await query('SELECT id FROM users WHERE enrollment_number = ?', [enrollment_number.trim()]);
    if (existingEnroll.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this enrollment number already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const selectedCourse = 'IMsc IT'; // Locked to IMsc IT
    const selectedDivision = division || 'Div A';

    // Insert new student
    const result = await query(
      `INSERT INTO users (name, email, enrollment_number, password, role, course, semester, division, academic_year, status) 
       VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, 'active')`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        enrollment_number.trim(),
        hashedPassword,
        selectedCourse,
        semester || 'SEM 7',
        selectedDivision,
        academic_year || '2026-2027'
      ]
    );

    const userId = result.insertId || (await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()])).rows[0].id;

    // Generate JWT Token
    const token = jwt.sign(
      { id: userId, email: email.trim().toLowerCase(), role: 'student' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully!',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        enrollment_number: enrollment_number.trim(),
        role: 'student',
        course: selectedCourse,
        semester: semester || 'SEM 7',
        division: selectedDivision,
        academic_year: academic_year || '2026-2027'
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
};

// Student Login (accepts Email or Enrollment Number)
exports.studentLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email/Enrollment Number and Password.' });
    }

    const trimmedIdent = identifier.trim();

    // Query user by email or enrollment_number
    const result = await query(
      `SELECT * FROM users WHERE (email = ? OR enrollment_number = ?) AND role = 'student'`,
      [trimmedIdent.toLowerCase(), trimmedIdent]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or student account not found.' });
    }

    const user = result.rows[0];

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        enrollment_number: user.enrollment_number,
        role: user.role,
        course: user.course || 'IMsc IT',
        semester: user.semester,
        division: user.division || 'Div A',
        academic_year: user.academic_year || '2026-2027'
      }
    });
  } catch (error) {
    console.error('Student Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide admin email and password.' });
    }

    const result = await query(
      `SELECT * FROM users WHERE email = ? AND role = 'admin'`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    const admin = result.rows[0];

    if (admin.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Admin account is inactive.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Admin authentication successful!',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        course: 'IMsc IT'
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during admin login.' });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};
