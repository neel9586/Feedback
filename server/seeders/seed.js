const bcrypt = require('bcryptjs');
const { initDB, query, getDBType } = require('../database/db');

const seedDatabase = async () => {
  console.log('[Seeder] Starting database seeding process...');
  await initDB();
  const dbType = getDBType();

  // Create tables if in SQLite mode
  if (dbType === 'sqlite') {
    console.log('[Seeder] Creating SQLite tables...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        enrollment_number TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        course TEXT DEFAULT 'IMsc IT',
        semester TEXT DEFAULT 'SEM 7',
        division TEXT DEFAULT 'Div A',
        academic_year TEXT DEFAULT '2026-2027',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await query(`ALTER TABLE users ADD COLUMN division TEXT DEFAULT 'Div A'`);
    } catch (e) {
      // Column already exists
    }

    await query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_name TEXT NOT NULL,
        subject_code TEXT,
        semester TEXT NOT NULL,
        academic_year TEXT NOT NULL DEFAULT '2026-2027',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_name TEXT NOT NULL,
        email TEXT,
        department TEXT DEFAULT 'IMsc IT',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS subject_faculty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        academic_year TEXT NOT NULL DEFAULT '2026-2027',
        semester TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS feedback_forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        course TEXT DEFAULT 'IMsc IT',
        semester TEXT NOT NULL,
        academic_year TEXT NOT NULL DEFAULT '2026-2027',
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS feedback_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_form_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        reference_number TEXT UNIQUE NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, feedback_form_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS feedback_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_text TEXT NOT NULL,
        question_type TEXT DEFAULT 'rating',
        display_order INTEGER DEFAULT 1,
        required INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active'
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS feedback_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        answer_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else if (dbType === 'mysql') {
    console.log('[Seeder] Creating MySQL tables...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        enrollment_number VARCHAR(50) UNIQUE DEFAULT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
        course VARCHAR(100) DEFAULT 'IMsc IT',
        semester VARCHAR(20) DEFAULT 'SEM 7',
        division VARCHAR(20) DEFAULT 'Div A',
        academic_year VARCHAR(20) DEFAULT '2026-2027',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_name VARCHAR(150) NOT NULL,
        subject_code VARCHAR(50) DEFAULT NULL,
        semester VARCHAR(20) NOT NULL,
        academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id INT AUTO_INCREMENT PRIMARY KEY,
        faculty_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) DEFAULT NULL,
        department VARCHAR(100) DEFAULT 'IMsc IT',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS subject_faculty (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        faculty_id INT NOT NULL,
        academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
        semester VARCHAR(20) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS feedback_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        course VARCHAR(100) DEFAULT 'IMsc IT',
        semester VARCHAR(20) NOT NULL,
        academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
        start_date DATE DEFAULT NULL,
        end_date DATE DEFAULT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS feedback_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        feedback_form_id INT NOT NULL,
        student_id INT NOT NULL,
        reference_number VARCHAR(50) UNIQUE NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_student_form (student_id, feedback_form_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS feedback_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) DEFAULT 'rating',
        display_order INT DEFAULT 1,
        required TINYINT(1) DEFAULT 1,
        status ENUM('active', 'inactive') DEFAULT 'active'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS feedback_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        submission_id INT NOT NULL,
        question_id INT NOT NULL,
        subject_id INT NOT NULL,
        faculty_id INT NOT NULL,
        rating INT NOT NULL,
        answer_text TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  // 1. Seed Questions (Google Form 10 Questions)
  const questions = [
    "Has the teacher covered entire syllabus as prescribed by University/College?",
    "Has the teacher covered relevant topics beyond syllabus?",
    "Effectiveness of Teacher in terms of Technical content / Course content",
    "Effectiveness of Teacher in terms of Communication skills",
    "Effectiveness of Teacher in terms of Use of teaching aids",
    "Pace on which contents were covered",
    "Motivation & inspiration for students to learn",
    "Support for the development of students' skill Practical demonstration and Hands on training",
    "Clarity of expectations of students",
    "Willingness to offer help and advice to students"
  ];

  console.log('[Seeder] Seeding Feedback Questions...');
  for (let i = 0; i < questions.length; i++) {
    const qText = questions[i];
    const existingQ = await query('SELECT id FROM feedback_questions WHERE question_text = ?', [qText]);
    if (existingQ.rows.length === 0) {
      await query(
        'INSERT INTO feedback_questions (question_text, question_type, display_order, required, status) VALUES (?, ?, ?, ?, ?)',
        [qText, 'rating', i + 1, 1, 'active']
      );
    }
  }

  // Clear out existing sample students except Admin
  console.log('[Seeder] Cleaning existing student directory...');
  await query(`DELETE FROM users WHERE role = 'student'`);
  await query(`DELETE FROM feedback_submissions`);
  await query(`DELETE FROM feedback_answers`);

  // 2. Seed Users (Admin & Only One Student: Neel)
  console.log('[Seeder] Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassRaw = process.env.ADMIN_PASSWORD || 'mscitadmin#2026';
  const adminPassword = await bcrypt.hash(adminPassRaw, salt);
  const studentPassword = await bcrypt.hash('student123', salt);

  // Admin Account
  const existingAdmin = await query('SELECT id FROM users WHERE email = ? OR email = ? OR role = ?', [adminEmail, 'admin@college.edu', 'admin']);
  if (existingAdmin.rows.length === 0) {
    await query(
      'INSERT INTO users (name, email, enrollment_number, password, role, course, semester, division, academic_year, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['System Administrator', adminEmail, 'ADMIN001', adminPassword, 'admin', 'IMsc IT', 'ALL', 'N/A', '2026-2027', 'active']
    );
  } else {
    await query(
      'UPDATE users SET name = ?, email = ?, password = ?, role = ?, course = ?, academic_year = ?, status = ? WHERE id = ?',
      ['System Administrator', adminEmail, adminPassword, 'admin', 'IMsc IT', '2026-2027', 'active', existingAdmin.rows[0].id]
    );
  }

  // Single Student Account: Neel
  const neelStudent = {
    name: 'Neel',
    email: 'neel.student@college.edu',
    enrollment: '202609001',
    sem: 'SEM 9',
    div: 'Div A',
    year: '2026-2027'
  };

  await query(
    'INSERT INTO users (name, email, enrollment_number, password, role, course, semester, division, academic_year, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [neelStudent.name, neelStudent.email, neelStudent.enrollment, studentPassword, 'student', 'IMsc IT', neelStudent.sem, neelStudent.div, neelStudent.year, 'active']
  );

  // 3. Seed Faculty Members
  console.log('[Seeder] Seeding Faculty Members...');
  const facultyList = [
    { name: 'Prof. Leena Chaudhari', dept: 'IMsc IT' },
    { name: 'Dr. Ronak Vadiwala', dept: 'IMsc IT' },
    { name: 'Prof. Neha Surti', dept: 'IMsc IT' },
    { name: 'Dr. Brijesh Mehta', dept: 'IMsc IT' },
    { name: 'Prof. Shashikant Patel', dept: 'IMsc IT' },
    { name: 'Prof. Bhavik Chauhan', dept: 'IMsc IT' },
    { name: 'Prof. Divya R. Padhiyar', dept: 'IMsc IT' },
    { name: 'Prof. Harshil A. Naik', dept: 'IMsc IT' },
    { name: 'Prof. Priyanka D. Rathod', dept: 'IMsc IT' },
    { name: 'Prof. Priyanka C. Patil', dept: 'IMsc IT' },
    { name: 'Dr. Smruti H. Mehta', dept: 'IMsc IT' },
    { name: 'Prof. Bhavik A. Chauhan', dept: 'IMsc IT' }
  ];

  const facultyMap = {};
  for (const fac of facultyList) {
    let existingFac = await query('SELECT id FROM faculty WHERE faculty_name = ?', [fac.name]);
    let facId;
    if (existingFac.rows.length === 0) {
      const res = await query(
        'INSERT INTO faculty (faculty_name, email, department, status) VALUES (?, ?, ?, ?)',
        [fac.name, `${fac.name.toLowerCase().replace(/[^a-z]/g, '')}@college.edu`, fac.dept, 'active']
      );
      facId = res.insertId || (await query('SELECT id FROM faculty WHERE faculty_name = ?', [fac.name])).rows[0].id;
    } else {
      facId = existingFac.rows[0].id;
    }
    facultyMap[fac.name] = facId;
  }

  // 4. Seed Subjects & Subject-Faculty Mappings
  console.log('[Seeder] Seeding Subjects & Subject-Faculty Mappings...');
  
  // SEM 7 Subjects
  const sem7Subjects = [
    { name: 'Python Prog.-2', code: 'IT701', facs: ['Prof. Leena Chaudhari', 'Prof. Bhavik Chauhan'] },
    { name: 'Cyber Security', code: 'IT702', facs: ['Dr. Ronak Vadiwala', 'Prof. Bhavik Chauhan'] },
    { name: 'Laravel', code: 'IT703', facs: ['Prof. Neha Surti', 'Prof. Shashikant Patel'] },
    { name: 'AIDS', code: 'IT704', facs: ['Prof. Neha Surti', 'Dr. Brijesh Mehta'] },
    { name: 'SQA', code: 'IT705', facs: ['Dr. Brijesh Mehta', 'Prof. Shashikant Patel'] }
  ];

  // SEM 9 Subjects
  const sem9Subjects = [
    { name: 'Big Data', code: 'IT901', facs: ['Prof. Divya R. Padhiyar', 'Dr. Ronak Vadiwala'] },
    { name: 'Java Swing', code: 'IT902', facs: ['Prof. Harshil A. Naik', 'Prof. Priyanka D. Rathod'] },
    { name: 'SEO', code: 'IT903', facs: ['Dr. Brijesh Mehta', 'Prof. Priyanka C. Patil'] },
    { name: 'Cloud Computing', code: 'IT904', facs: ['Dr. Smruti H. Mehta', 'Prof. Bhavik A. Chauhan'] },
    { name: 'BlockChain Technology', code: 'IT905', facs: ['Prof. Divya R. Padhiyar', 'Dr. Ronak Vadiwala'] }
  ];

  const seedSubjectSet = async (subjects, sem, year) => {
    for (const sub of subjects) {
      let existingSub = await query(
        'SELECT id FROM subjects WHERE subject_name = ? AND semester = ?',
        [sub.name, sem]
      );
      let subId;
      if (existingSub.rows.length === 0) {
        const res = await query(
          'INSERT INTO subjects (subject_name, subject_code, semester, academic_year, status) VALUES (?, ?, ?, ?, ?)',
          [sub.name, sub.code, sem, year, 'active']
        );
        subId = res.insertId || (await query('SELECT id FROM subjects WHERE subject_name = ? AND semester = ?', [sub.name, sem])).rows[0].id;
      } else {
        subId = existingSub.rows[0].id;
        await query('UPDATE subjects SET academic_year = ? WHERE id = ?', [year, subId]);
      }

      // Map faculty
      for (const facName of sub.facs) {
        const facId = facultyMap[facName];
        if (facId) {
          const existingMap = await query(
            'SELECT id FROM subject_faculty WHERE subject_id = ? AND faculty_id = ? AND semester = ?',
            [subId, facId, sem]
          );
          if (existingMap.rows.length === 0) {
            await query(
              'INSERT INTO subject_faculty (subject_id, faculty_id, academic_year, semester, status) VALUES (?, ?, ?, ?, ?)',
              [subId, facId, year, sem, 'active']
            );
          } else {
            await query('UPDATE subject_faculty SET academic_year = ? WHERE id = ?', [year, existingMap.rows[0].id]);
          }
        }
      }
    }
  };

  await seedSubjectSet(sem7Subjects, 'SEM 7', '2026-2027');
  await seedSubjectSet(sem9Subjects, 'SEM 9', '2026-2027');

  // 5. Seed Feedback Forms
  console.log('[Seeder] Seeding Feedback Forms...');
  const forms = [
    { title: 'End Semester Students Feedback (IMsc IT SEM 1 2026-2027)', sem: 'SEM 1', year: '2026-2027' },
    { title: 'End Semester Students Feedback (IMsc IT SEM 3 2026-2027)', sem: 'SEM 3', year: '2026-2027' },
    { title: 'End Semester Students Feedback (IMsc IT SEM 5 2026-2027)', sem: 'SEM 5', year: '2026-2027' },
    { title: 'End Semester Students Feedback (IMsc IT SEM 7 2026-2027)', sem: 'SEM 7', year: '2026-2027' },
    { title: 'End Semester Students Feedback (IMsc IT SEM 9 2026-2027)', sem: 'SEM 9', year: '2026-2027' }
  ];

  for (const f of forms) {
    const existingForm = await query('SELECT id FROM feedback_forms WHERE semester = ? AND academic_year = ?', [f.sem, f.year]);
    if (existingForm.rows.length === 0) {
      await query(
        'INSERT INTO feedback_forms (title, course, semester, academic_year, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [f.title, 'IMsc IT', f.sem, f.year, '2026-01-01', '2027-12-31', 'active']
      );
    }
  }

  console.log('[Seeder] Database seeding completed successfully with single student Neel!');
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seeder] Error seeding database:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
