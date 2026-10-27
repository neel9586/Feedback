const { query } = require('../database/db');
const multer = require('multer');
const XLSX = require('xlsx');

// Multer: store file in memory for processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx/.xls) and CSV files are allowed.'));
    }
  }
});
exports.uploadMiddleware = upload.single('file');

// Helper: generate a simple unique ID without uuid package
const genBatchId = () => `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 0a. Upload Excel / CSV and parse into manual_feedback table
exports.uploadExcelFeedback = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Parse workbook from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty or has no data rows.' });
    }

    // Normalize headers (case-insensitive, trim whitespace)
    const normalize = str => String(str || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');

    const batchId = genBatchId();
    const filename = req.file.originalname;

    let inserted = 0;
    let skipped = 0;
    const warnings = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      // Map columns flexibly
      const getCol = (...keys) => {
        for (const key of Object.keys(row)) {
          if (keys.some(k => normalize(key) === normalize(k))) return String(row[key] || '').trim();
        }
        return '';
      };

      const studentName  = getCol('student name', 'name', 'student');
      const enrollNo     = getCol('enrollment number', 'enrollment no', 'enroll no', 'enrollment', 'roll no', 'roll number');
      const semester     = getCol('semester', 'sem');
      const academicYear = getCol('academic year', 'year', 'academic yr');
      const subjectName  = getCol('subject name', 'subject', 'sub name');
      const subjectCode  = getCol('subject code', 'sub code', 'code');
      const facultyName  = getCol('faculty name', 'faculty', 'teacher', 'teacher name');
      const question     = getCol('question', 'question text', 'q');
      const ratingRaw    = getCol('rating', 'score', 'marks', 'grade');
      const rating       = parseInt(ratingRaw, 10);

      if (!facultyName && !subjectName) {
        skipped++;
        warnings.push(`Row ${i + 2}: Missing both faculty name and subject name – skipped.`);
        continue;
      }
      if (isNaN(rating) || rating < 1 || rating > 5) {
        skipped++;
        warnings.push(`Row ${i + 2}: Invalid rating "${ratingRaw}" (must be 1–5) – skipped.`);
        continue;
      }

      await query(
        `INSERT INTO manual_feedback (batch_id, upload_filename, student_name, enrollment_number, semester, academic_year, subject_name, subject_code, faculty_name, question, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [batchId, filename, studentName, enrollNo, semester, academicYear, subjectName, subjectCode, facultyName, question, rating]
      );
      inserted++;
    }

    return res.status(201).json({
      success: true,
      message: `Upload complete. ${inserted} rows imported, ${skipped} skipped.`,
      batchId,
      inserted,
      skipped,
      warnings: warnings.slice(0, 20) // limit warnings shown
    });
  } catch (error) {
    console.error('Error uploading Excel:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Excel upload.' });
  }
};

// 0b. Get Upload History (distinct batches)
exports.getUploadHistory = async (req, res) => {
  try {
    const result = await query(`
      SELECT batch_id, upload_filename,
             MIN(uploaded_at) as uploaded_at,
             COUNT(*) as row_count,
             COUNT(DISTINCT faculty_name) as faculty_count,
             COUNT(DISTINCT subject_name) as subject_count
      FROM manual_feedback
      GROUP BY batch_id, upload_filename
      ORDER BY MIN(uploaded_at) DESC
    `);
    return res.json({ success: true, batches: result.rows });
  } catch (error) {
    console.error('Error fetching upload history:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch upload history.' });
  }
};

// 0c. Delete an uploaded batch
exports.deleteUploadedBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    await query('DELETE FROM manual_feedback WHERE batch_id = ?', [batchId]);
    return res.json({ success: true, message: 'Batch deleted successfully.' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete batch.' });
  }
};

// 0d. Get analysis data from manual_feedback
exports.getUploadedAnalysis = async (req, res) => {
  try {
    const { semester, academic_year, faculty_name, subject_name, batch_id } = req.query;

    let where = 'WHERE 1=1';
    const params = [];
    if (semester && semester !== 'ALL') { where += ' AND semester = ?'; params.push(semester); }
    if (academic_year && academic_year !== 'ALL') { where += ' AND academic_year = ?'; params.push(academic_year); }
    if (faculty_name && faculty_name !== 'ALL') { where += ' AND faculty_name = ?'; params.push(faculty_name); }
    if (subject_name && subject_name !== 'ALL') { where += ' AND subject_name = ?'; params.push(subject_name); }
    if (batch_id && batch_id !== 'ALL') { where += ' AND batch_id = ?'; params.push(batch_id); }

    // Faculty-wise average
    const facultyAvg = await query(`
      SELECT faculty_name, AVG(rating) as avg_rating, COUNT(*) as total_ratings,
             GROUP_CONCAT(DISTINCT semester) as semesters
      FROM manual_feedback ${where}
      GROUP BY faculty_name
      ORDER BY avg_rating DESC
    `, params);

    // Subject-wise average
    const subjectAvg = await query(`
      SELECT subject_name, subject_code, AVG(rating) as avg_rating, COUNT(*) as total_ratings,
             GROUP_CONCAT(DISTINCT semester) as semesters
      FROM manual_feedback ${where}
      GROUP BY subject_name, subject_code
      ORDER BY avg_rating DESC
    `, params);

    // Semester-wise average
    const semesterAvg = await query(`
      SELECT semester, AVG(rating) as avg_rating, COUNT(*) as total_ratings,
             COUNT(DISTINCT faculty_name) as faculty_count,
             COUNT(DISTINCT subject_name) as subject_count
      FROM manual_feedback ${where}
      GROUP BY semester
      ORDER BY semester ASC
    `, params);

    // Rating distribution (1–5)
    const distRes = await query(`
      SELECT rating, COUNT(*) as count
      FROM manual_feedback ${where}
      GROUP BY rating
      ORDER BY rating ASC
    `, params);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distRes.rows.forEach(r => { distribution[r.rating] = parseInt(r.count, 10); });

    // Overall stats
    const statsRes = await query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_rows,
             COUNT(DISTINCT faculty_name) as total_faculty,
             COUNT(DISTINCT subject_name) as total_subjects,
             COUNT(DISTINCT semester) as total_semesters
      FROM manual_feedback ${where}
    `, params);
    const stats = statsRes.rows[0] || {};

    // Filter options (distinct values in table)
    const semOpts = await query(`SELECT DISTINCT semester FROM manual_feedback WHERE semester != '' ORDER BY semester`);
    const yearOpts = await query(`SELECT DISTINCT academic_year FROM manual_feedback WHERE academic_year != '' ORDER BY academic_year`);
    const facOpts  = await query(`SELECT DISTINCT faculty_name FROM manual_feedback WHERE faculty_name != '' ORDER BY faculty_name`);
    const subOpts  = await query(`SELECT DISTINCT subject_name FROM manual_feedback WHERE subject_name != '' ORDER BY subject_name`);
    const batchOpts= await query(`SELECT DISTINCT batch_id, upload_filename, MIN(uploaded_at) as uploaded_at FROM manual_feedback GROUP BY batch_id, upload_filename ORDER BY MIN(uploaded_at) DESC`);

    return res.json({
      success: true,
      stats: {
        avgRating: stats.avg_rating ? parseFloat(Number(stats.avg_rating).toFixed(2)) : 0,
        totalRows: parseInt(stats.total_rows, 10) || 0,
        totalFaculty: parseInt(stats.total_faculty, 10) || 0,
        totalSubjects: parseInt(stats.total_subjects, 10) || 0,
        totalSemesters: parseInt(stats.total_semesters, 10) || 0
      },
      charts: {
        facultyRatings: facultyAvg.rows.map(r => ({
          name: r.faculty_name,
          avgRating: parseFloat(Number(r.avg_rating).toFixed(2)),
          totalRatings: parseInt(r.total_ratings, 10),
          semesters: r.semesters
        })),
        subjectRatings: subjectAvg.rows.map(r => ({
          name: r.subject_name,
          code: r.subject_code,
          avgRating: parseFloat(Number(r.avg_rating).toFixed(2)),
          totalRatings: parseInt(r.total_ratings, 10),
          semesters: r.semesters
        })),
        semesterRatings: semesterAvg.rows.map(r => ({
          semester: r.semester,
          avgRating: parseFloat(Number(r.avg_rating).toFixed(2)),
          totalRatings: parseInt(r.total_ratings, 10),
          facultyCount: parseInt(r.faculty_count, 10),
          subjectCount: parseInt(r.subject_count, 10)
        })),
        ratingDistribution: distribution
      },
      filterOptions: {
        semesters: semOpts.rows.map(r => r.semester),
        academicYears: yearOpts.rows.map(r => r.academic_year),
        faculty: facOpts.rows.map(r => r.faculty_name),
        subjects: subOpts.rows.map(r => r.subject_name),
        batches: batchOpts.rows
      }
    });
  } catch (error) {
    console.error('Error fetching upload analysis:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analysis data.' });
  }
};

// 1. Admin Dashboard Analytics Summary
exports.getDashboardStats = async (req, res) => {
  try {
    const { semester, academic_year } = req.query;

    let semFilter = '';
    let params = [];
    if (semester && semester !== 'ALL') {
      semFilter = 'WHERE semester = ?';
      params.push(semester);
    }

    // Basic counts
    const studentsRes = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'student' ${semFilter ? 'AND ' + semFilter.substring(6) : ''}`, params);
    const totalStudents = studentsRes.rows[0]?.count || 0;

    const subsRes = await query(`SELECT COUNT(*) as count FROM feedback_submissions`);
    const totalSubmissions = subsRes.rows[0]?.count || 0;

    const subjectsRes = await query(`SELECT COUNT(*) as count FROM subjects WHERE status = 'active'`);
    const totalSubjects = subjectsRes.rows[0]?.count || 0;

    const facultyRes = await query(`SELECT COUNT(*) as count FROM faculty WHERE status = 'active'`);
    const totalFaculty = facultyRes.rows[0]?.count || 0;

    // Overall average rating
    const avgRes = await query(`SELECT AVG(rating) as avg_rating, COUNT(id) as total_answers FROM feedback_answers`);
    const overallAvg = avgRes.rows[0]?.avg_rating ? parseFloat(Number(avgRes.rows[0].avg_rating).toFixed(2)) : 0;

    // Subject-wise average rating
    const subjectAvgRes = await query(`
      SELECT s.id, s.subject_name, s.subject_code, s.semester, AVG(fa.rating) as avg_rating, COUNT(fa.id) as total_ratings
      FROM feedback_answers fa
      JOIN subjects s ON fa.subject_id = s.id
      GROUP BY s.id, s.subject_name, s.subject_code, s.semester
      ORDER BY avg_rating DESC
    `);

    // Faculty-wise average rating
    const facultyAvgRes = await query(`
      SELECT f.id, f.faculty_name, f.department, AVG(fa.rating) as avg_rating, COUNT(fa.id) as total_ratings
      FROM feedback_answers fa
      JOIN faculty f ON fa.faculty_id = f.id
      GROUP BY f.id, f.faculty_name, f.department
      ORDER BY avg_rating DESC
    `);

    // Rating distribution (1 to 5 stars)
    const distRes = await query(`
      SELECT rating, COUNT(*) as count 
      FROM feedback_answers 
      GROUP BY rating 
      ORDER BY rating ASC
    `);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distRes.rows.forEach(r => {
      distribution[r.rating] = parseInt(r.count, 10);
    });

    // Submissions timeline (by date)
    const timelineRes = await query(`
      SELECT DATE(submitted_at) as date, COUNT(*) as count
      FROM feedback_submissions
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
      LIMIT 14
    `);

    return res.json({
      success: true,
      stats: {
        totalStudents,
        totalSubmissions,
        pendingFeedback: Math.max(0, totalStudents - totalSubmissions),
        totalSubjects,
        totalFaculty,
        overallAvg
      },
      charts: {
        subjectRatings: subjectAvgRes.rows.map(r => ({
          id: r.id,
          name: r.subject_name,
          semester: r.semester,
          avgRating: parseFloat(Number(r.avg_rating).toFixed(2)),
          totalRatings: r.total_ratings
        })),
        facultyRatings: facultyAvgRes.rows.map(r => ({
          id: r.id,
          name: r.faculty_name,
          dept: r.department,
          avgRating: parseFloat(Number(r.avg_rating).toFixed(2)),
          totalRatings: r.total_ratings
        })),
        ratingDistribution: distribution,
        timeline: timelineRes.rows
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Internal server error fetching dashboard statistics.' });
  }
};

// 2. Get All Feedback Submissions (With Search, Filter, Pagination)
exports.getFeedbackSubmissions = async (req, res) => {
  try {
    const { search, semester, subject_id, faculty_id, academic_year, page = 1, limit = 10 } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ` AND (u.name LIKE ? OR u.enrollment_number LIKE ? OR u.email LIKE ? OR fs.reference_number LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (semester && semester !== 'ALL') {
      whereClause += ` AND ff.semester = ?`;
      params.push(semester);
    }

    if (academic_year && academic_year !== 'ALL') {
      whereClause += ` AND ff.academic_year = ?`;
      params.push(academic_year);
    }

    const countSql = `
      SELECT COUNT(DISTINCT fs.id) as total
      FROM feedback_submissions fs
      JOIN users u ON fs.student_id = u.id
      JOIN feedback_forms ff ON fs.feedback_form_id = ff.id
      ${whereClause}
    `;

    const countRes = await query(countSql, params);
    const totalRecords = countRes.rows[0]?.total || 0;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT fs.id, fs.reference_number, fs.submitted_at, 
             u.name as student_name, u.email as student_email, u.enrollment_number, u.course,
             ff.title as form_title, ff.semester, ff.academic_year,
             AVG(fa.rating) as avg_rating
      FROM feedback_submissions fs
      JOIN users u ON fs.student_id = u.id
      JOIN feedback_forms ff ON fs.feedback_form_id = ff.id
      LEFT JOIN feedback_answers fa ON fs.id = fa.submission_id
      ${whereClause}
      GROUP BY fs.id, fs.reference_number, fs.submitted_at, u.name, u.email, u.enrollment_number, u.course, ff.title, ff.semester, ff.academic_year
      ORDER BY fs.submitted_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const dataRes = await query(dataSql, params);

    const submissions = dataRes.rows.map(r => ({
      id: r.id,
      reference_number: r.reference_number,
      submitted_at: r.submitted_at,
      student_name: r.student_name,
      student_email: r.student_email,
      enrollment_number: r.enrollment_number,
      course: r.course,
      semester: r.semester,
      academic_year: r.academic_year,
      avg_rating: r.avg_rating ? parseFloat(Number(r.avg_rating).toFixed(2)) : 0
    }));

    return res.json({
      success: true,
      submissions,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching submissions list:', error);
    return res.status(500).json({ success: false, message: 'Internal server error fetching submissions.' });
  }
};

// 3. Get Individual Submission Detailed View
exports.getSubmissionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const subRes = await query(`
      SELECT fs.id, fs.reference_number, fs.submitted_at,
             u.name as student_name, u.email as student_email, u.enrollment_number, u.course, u.semester as student_semester, u.academic_year as student_year,
             ff.title as form_title, ff.semester, ff.academic_year
      FROM feedback_submissions fs
      JOIN users u ON fs.student_id = u.id
      JOIN feedback_forms ff ON fs.feedback_form_id = ff.id
      WHERE fs.id = ?
    `, [id]);

    if (subRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const submission = subRes.rows[0];

    const answersRes = await query(`
      SELECT fa.id, fa.rating, fa.answer_text,
             fq.question_text, fq.display_order,
             s.id as subject_id, s.subject_name, s.subject_code,
             f.id as faculty_id, f.faculty_name, f.department
      FROM feedback_answers fa
      JOIN feedback_questions fq ON fa.question_id = fq.id
      JOIN subjects s ON fa.subject_id = s.id
      JOIN faculty f ON fa.faculty_id = f.id
      WHERE fa.submission_id = ?
      ORDER BY s.subject_name ASC, f.faculty_name ASC, fq.display_order ASC
    `, [id]);

    // Group answers by Subject & Faculty
    const grouped = {};
    answersRes.rows.forEach(ans => {
      const key = `${ans.subject_name} (${ans.faculty_name})`;
      if (!grouped[key]) {
        grouped[key] = {
          subject_name: ans.subject_name,
          subject_code: ans.subject_code,
          faculty_name: ans.faculty_name,
          department: ans.department,
          ratings: []
        };
      }
      grouped[key].ratings.push({
        question_id: ans.question_id,
        question_text: ans.question_text,
        rating: ans.rating,
        display_order: ans.display_order
      });
    });

    return res.json({
      success: true,
      submission,
      groupedAnswers: Object.values(grouped),
      rawAnswers: answersRes.rows
    });
  } catch (error) {
    console.error('Error fetching submission detail:', error);
    return res.status(500).json({ success: false, message: 'Internal server error fetching submission detail.' });
  }
};

// 4. Delete Submission
exports.deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const checkRes = await query('SELECT id FROM feedback_submissions WHERE id = ?', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    await query('DELETE FROM feedback_answers WHERE submission_id = ?', [id]);
    await query('DELETE FROM feedback_submissions WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Submission deleted successfully.' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return res.status(500).json({ success: false, message: 'Internal server error deleting submission.' });
  }
};

// 5. Export Feedback Data as CSV
exports.exportFeedbackCSV = async (req, res) => {
  try {
    const { semester, academic_year } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (semester && semester !== 'ALL') {
      whereClause += ` AND ff.semester = ?`;
      params.push(semester);
    }
    if (academic_year && academic_year !== 'ALL') {
      whereClause += ` AND ff.academic_year = ?`;
      params.push(academic_year);
    }

    const sql = `
      SELECT fs.reference_number, fs.submitted_at,
             u.name as student_name, u.enrollment_number, u.email as student_email,
             s.subject_name, s.subject_code,
             f.faculty_name, f.department,
             fq.question_text,
             fa.rating,
             ff.semester, ff.academic_year
      FROM feedback_answers fa
      JOIN feedback_submissions fs ON fa.submission_id = fs.id
      JOIN users u ON fs.student_id = u.id
      JOIN feedback_forms ff ON fs.feedback_form_id = ff.id
      JOIN subjects s ON fa.subject_id = s.id
      JOIN faculty f ON fa.faculty_id = f.id
      JOIN feedback_questions fq ON fa.question_id = fq.id
      ${whereClause}
      ORDER BY fs.submitted_at DESC, s.subject_name ASC, fq.display_order ASC
    `;

    const dataRes = await query(sql, params);

    // Build CSV string
    const headers = [
      'Reference Number',
      'Student Name',
      'Enrollment Number',
      'Student Email',
      'Semester',
      'Academic Year',
      'Subject Code',
      'Subject Name',
      'Faculty Name',
      'Question',
      'Rating',
      'Submission Date'
    ];

    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';

    dataRes.rows.forEach(r => {
      const row = [
        r.reference_number,
        r.student_name,
        r.enrollment_number,
        r.student_email,
        r.semester,
        r.academic_year,
        r.subject_code || '',
        r.subject_name,
        r.faculty_name,
        r.question_text.replace(/"/g, '""'),
        r.rating,
        new Date(r.submitted_at).toLocaleString()
      ];
      csvContent += row.map(val => `"${val}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Feedback_Export_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({ success: false, message: 'Internal server error exporting feedback CSV.' });
  }
};

// 6. Management Module: Students
exports.getStudents = async (req, res) => {
  try {
    const { search, semester } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, u.enrollment_number, u.course, u.semester, u.academic_year, u.status, u.created_at,
             (SELECT COUNT(*) FROM feedback_submissions fs WHERE fs.student_id = u.id) as submissions_count
      FROM users u
      WHERE u.role = 'student'
    `;
    let params = [];
    if (search) {
      sql += ` AND (u.name LIKE ? OR u.enrollment_number LIKE ? OR u.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (semester && semester !== 'ALL') {
      sql += ` AND u.semester = ?`;
      params.push(semester);
    }
    sql += ` ORDER BY u.id DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, students: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
};

exports.updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await query('UPDATE users SET status = ? WHERE id = ? AND role = \'student\'', [status, id]);
    return res.json({ success: true, message: 'Student status updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update student status.' });
  }
};

// 7. Management Module: Subjects
exports.getSubjects = async (req, res) => {
  try {
    const result = await query('SELECT * FROM subjects ORDER BY semester ASC, subject_name ASC');
    return res.json({ success: true, subjects: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { subject_name, subject_code, semester, academic_year } = req.body;
    if (!subject_name || !semester || !academic_year) {
      return res.status(400).json({ success: false, message: 'Subject name, semester, and academic year are required.' });
    }
    await query(
      'INSERT INTO subjects (subject_name, subject_code, semester, academic_year, status) VALUES (?, ?, ?, ?, ?)',
      [subject_name.trim(), subject_code ? subject_code.trim() : null, semester, academic_year, 'active']
    );
    return res.status(201).json({ success: true, message: 'Subject created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create subject.' });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_name, subject_code, semester, academic_year, status } = req.body;
    await query(
      'UPDATE subjects SET subject_name = ?, subject_code = ?, semester = ?, academic_year = ?, status = ? WHERE id = ?',
      [subject_name, subject_code, semester, academic_year, status, id]
    );
    return res.json({ success: true, message: 'Subject updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update subject.' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM subject_faculty WHERE subject_id = ?', [id]);
    await query('DELETE FROM subjects WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete subject.' });
  }
};

// 8. Management Module: Faculty
exports.getFaculty = async (req, res) => {
  try {
    const result = await query('SELECT * FROM faculty ORDER BY faculty_name ASC');
    return res.json({ success: true, faculty: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch faculty.' });
  }
};

exports.createFaculty = async (req, res) => {
  try {
    const { faculty_name, email, department } = req.body;
    if (!faculty_name) {
      return res.status(400).json({ success: false, message: 'Faculty name is required.' });
    }
    await query(
      'INSERT INTO faculty (faculty_name, email, department, status) VALUES (?, ?, ?, ?)',
      [faculty_name.trim(), email ? email.trim() : null, department || 'IMsc IT', 'active']
    );
    return res.status(201).json({ success: true, message: 'Faculty created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create faculty.' });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { faculty_name, email, department, status } = req.body;
    await query(
      'UPDATE faculty SET faculty_name = ?, email = ?, department = ?, status = ? WHERE id = ?',
      [faculty_name, email, department, status, id]
    );
    return res.json({ success: true, message: 'Faculty updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update faculty.' });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM subject_faculty WHERE faculty_id = ?', [id]);
    await query('DELETE FROM faculty WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Faculty deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete faculty.' });
  }
};

// 9. Management Module: Subject-Faculty Mappings
exports.getSubjectFacultyMappings = async (req, res) => {
  try {
    const result = await query(`
      SELECT sf.id, sf.academic_year, sf.semester, sf.status,
             s.id as subject_id, s.subject_name, s.subject_code,
             f.id as faculty_id, f.faculty_name, f.department
      FROM subject_faculty sf
      JOIN subjects s ON sf.subject_id = s.id
      JOIN faculty f ON sf.faculty_id = f.id
      ORDER BY sf.semester ASC, s.subject_name ASC
    `);
    return res.json({ success: true, mappings: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subject-faculty mappings.' });
  }
};

exports.createMapping = async (req, res) => {
  try {
    const { subject_id, faculty_id, semester, academic_year } = req.body;
    if (!subject_id || !faculty_id || !semester || !academic_year) {
      return res.status(400).json({ success: false, message: 'Subject, Faculty, Semester, and Academic Year are required.' });
    }
    await query(
      'INSERT INTO subject_faculty (subject_id, faculty_id, semester, academic_year, status) VALUES (?, ?, ?, ?, ?)',
      [subject_id, faculty_id, semester, academic_year, 'active']
    );
    return res.status(201).json({ success: true, message: 'Mapping created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create subject-faculty mapping.' });
  }
};

exports.deleteMapping = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM subject_faculty WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Mapping deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete mapping.' });
  }
};

// 10. Management Module: Feedback Forms
exports.getFeedbackForms = async (req, res) => {
  try {
    const result = await query('SELECT * FROM feedback_forms ORDER BY id DESC');
    return res.json({ success: true, forms: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch feedback forms.' });
  }
};

exports.createForm = async (req, res) => {
  try {
    const { title, course, semester, academic_year, start_date, end_date } = req.body;
    if (!title || !semester || !academic_year) {
      return res.status(400).json({ success: false, message: 'Title, semester, and academic year are required.' });
    }
    await query(
      'INSERT INTO feedback_forms (title, course, semester, academic_year, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, course || 'IMsc IT', semester, academic_year, start_date || null, end_date || null, 'active']
    );
    return res.status(201).json({ success: true, message: 'Feedback form created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create feedback form.' });
  }
};

exports.updateFormStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await query('UPDATE feedback_forms SET status = ? WHERE id = ?', [status, id]);
    return res.json({ success: true, message: 'Feedback form status updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update form status.' });
  }
};
