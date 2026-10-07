const { query } = require('../database/db');

// Get Student Dashboard Status
exports.getDashboardStatus = async (req, res) => {
  try {
    const student = req.user;

    // Find active form for student's semester and academic_year
    const formResult = await query(
      `SELECT * FROM feedback_forms WHERE semester = ? AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [student.semester]
    );

    let activeForm = formResult.rows[0] || null;

    if (!activeForm) {
      // Fallback to latest active form
      const fallbackForm = await query(`SELECT * FROM feedback_forms WHERE status = 'active' ORDER BY id DESC LIMIT 1`);
      activeForm = fallbackForm.rows[0] || null;
    }

    if (!activeForm) {
      return res.json({
        success: true,
        status: 'No Form Available',
        hasSubmitted: false,
        student: {
          name: student.name,
          email: student.email,
          enrollment_number: student.enrollment_number,
          course: student.course,
          semester: student.semester,
          academic_year: student.academic_year
        },
        form: null
      });
    }

    // Check if student has submitted for this form
    const subResult = await query(
      `SELECT * FROM feedback_submissions WHERE student_id = ? AND feedback_form_id = ?`,
      [student.id, activeForm.id]
    );

    const hasSubmitted = subResult.rows.length > 0;
    const submission = hasSubmitted ? subResult.rows[0] : null;

    return res.json({
      success: true,
      status: hasSubmitted ? 'Submitted' : 'Pending',
      hasSubmitted,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        enrollment_number: student.enrollment_number,
        course: student.course,
        semester: student.semester,
        academic_year: student.academic_year
      },
      form: {
        id: activeForm.id,
        title: activeForm.title,
        semester: activeForm.semester,
        academic_year: activeForm.academic_year,
        start_date: activeForm.start_date,
        end_date: activeForm.end_date
      },
      submission: submission ? {
        id: submission.id,
        reference_number: submission.reference_number,
        submitted_at: submission.submitted_at
      } : null
    });
  } catch (error) {
    console.error('Error fetching dashboard status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error fetching dashboard status.' });
  }
};

// Get Active Form with Questions & Subject-Faculty pairs
exports.getActiveForm = async (req, res) => {
  try {
    const student = req.user;

    // Find active form for student's semester
    let formResult = await query(
      `SELECT * FROM feedback_forms WHERE semester = ? AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [student.semester]
    );

    let form = formResult.rows[0];

    if (!form) {
      // Fallback to any active form
      formResult = await query(`SELECT * FROM feedback_forms WHERE status = 'active' ORDER BY id DESC LIMIT 1`);
      form = formResult.rows[0];
    }

    if (!form) {
      return res.status(444).json({ success: false, message: 'No active feedback form available at this time.' });
    }

    // Check duplicate submission
    const existingSub = await query(
      `SELECT id, reference_number, submitted_at FROM feedback_submissions WHERE student_id = ? AND feedback_form_id = ?`,
      [student.id, form.id]
    );

    if (existingSub.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this semester.',
        alreadySubmitted: true,
        submission: existingSub.rows[0]
      });
    }

    // Fetch active 10 rating questions
    const qResult = await query(
      `SELECT id, question_text, question_type, display_order, required FROM feedback_questions WHERE status = 'active' ORDER BY display_order ASC`
    );

    // Fetch Subject-Faculty pairs for this form's semester & academic year
    const sfResult = await query(
      `SELECT sf.id as mapping_id, s.id as subject_id, s.subject_name, s.subject_code, 
              f.id as faculty_id, f.faculty_name, f.department
       FROM subject_faculty sf
       JOIN subjects s ON sf.subject_id = s.id
       JOIN faculty f ON sf.faculty_id = f.id
       WHERE sf.semester = ? AND sf.academic_year = ? AND sf.status = 'active' AND s.status = 'active' AND f.status = 'active'
       ORDER BY s.subject_name ASC, f.faculty_name ASC`,
      [form.semester, form.academic_year]
    );

    return res.json({
      success: true,
      form: {
        id: form.id,
        title: form.title,
        course: form.course,
        semester: form.semester,
        academic_year: form.academic_year
      },
      questions: qResult.rows,
      subjectFacultyMappings: sfResult.rows
    });
  } catch (error) {
    console.error('Error fetching active form:', error);
    return res.status(500).json({ success: false, message: 'Internal server error fetching feedback form.' });
  }
};

// Submit Feedback
exports.submitFeedback = async (req, res) => {
  try {
    const student = req.user;
    const { feedback_form_id, ratings } = req.body;

    if (!feedback_form_id || !ratings || !Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid submission data.' });
    }

    // Check duplicate submission
    const existingSub = await query(
      `SELECT id FROM feedback_submissions WHERE student_id = ? AND feedback_form_id = ?`,
      [student.id, feedback_form_id]
    );

    if (existingSub.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this semester.'
      });
    }

    // Generate unique reference number (e.g., FB-2026-98A4K)
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceNumber = `FB-${new Date().getFullYear()}-${randomCode}`;

    // Create submission record
    const subRes = await query(
      `INSERT INTO feedback_submissions (feedback_form_id, student_id, reference_number) VALUES (?, ?, ?)`,
      [feedback_form_id, student.id, referenceNumber]
    );

    const submissionId = subRes.insertId || (await query('SELECT id FROM feedback_submissions WHERE reference_number = ?', [referenceNumber])).rows[0].id;

    // Save individual answers
    for (const r of ratings) {
      // r = { question_id, subject_id, faculty_id, rating }
      if (r.question_id && r.subject_id && r.faculty_id && r.rating) {
        await query(
          `INSERT INTO feedback_answers (submission_id, question_id, subject_id, faculty_id, rating) VALUES (?, ?, ?, ?, ?)`,
          [submissionId, r.question_id, r.subject_id, r.faculty_id, parseInt(r.rating, 10)]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully! Thank you for your feedback.',
      submission: {
        id: submissionId,
        reference_number: referenceNumber,
        submitted_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while processing feedback submission.' });
  }
};
