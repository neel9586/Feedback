const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { initDB } = require('./database/db');
const seedDatabase = require('./seeders/seed');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database initialization & seeder in Serverless and Local environments
let isInitialized = false;
let initPromise = null;

const ensureDBInitialized = async () => {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await initDB();
        await seedDatabase();
        isInitialized = true;
      } catch (err) {
        console.error('[Server Boot] DB Initialization error:', err);
      } finally {
        initPromise = null;
      }
    })();
  }
  await initPromise;
};

// Start background init
ensureDBInitialized();

// Middleware to ensure database is ready before processing API requests
app.use(async (req, res, next) => {
  try {
    await ensureDBInitialized();
    next();
  } catch (err) {
    next(err);
  }
});

// API Routes (supports both /api/* and direct /* paths for flexible serverless routing)
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

// Health check
const healthCheckHandler = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Student Feedback Management System API'
  });
};

app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// 404 Route handler for API
app.use(['/api/*', '/auth/*', '/student/*', '/admin/*'], (req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Student Feedback System Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});

module.exports = app;
