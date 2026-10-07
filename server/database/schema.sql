-- Student Feedback Management System SQL Schema
-- Target DB: MySQL 5.7+ / 8.0+

CREATE DATABASE IF NOT EXISTS `student_feedback_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `student_feedback_db`;

-- 1. Users Table (Students & Admins)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `enrollment_number` VARCHAR(50) UNIQUE DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `course` VARCHAR(100) DEFAULT 'IMsc IT',
  `semester` VARCHAR(20) DEFAULT 'SEM 7',
  `division` VARCHAR(20) DEFAULT 'Div A',
  `academic_year` VARCHAR(20) DEFAULT '2026-2027',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_name` VARCHAR(150) NOT NULL,
  `subject_code` VARCHAR(50) DEFAULT NULL,
  `semester` VARCHAR(20) NOT NULL,
  `academic_year` VARCHAR(20) NOT NULL DEFAULT '2026-2027',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Faculty Table
CREATE TABLE IF NOT EXISTS `faculty` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `faculty_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT 'IMsc IT',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Subject Faculty Mapping Table
CREATE TABLE IF NOT EXISTS `subject_faculty` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT NOT NULL,
  `faculty_id` INT NOT NULL,
  `academic_year` VARCHAR(20) NOT NULL DEFAULT '2026-2027',
  `semester` VARCHAR(20) NOT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Feedback Forms Configuration Table
CREATE TABLE IF NOT EXISTS `feedback_forms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `course` VARCHAR(100) DEFAULT 'IMsc IT',
  `semester` VARCHAR(20) NOT NULL,
  `academic_year` VARCHAR(20) NOT NULL DEFAULT '2026-2027',
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Feedback Submissions Table
CREATE TABLE IF NOT EXISTS `feedback_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `feedback_form_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `reference_number` VARCHAR(50) UNIQUE NOT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_student_form` (`student_id`, `feedback_form_id`),
  FOREIGN KEY (`feedback_form_id`) REFERENCES `feedback_forms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Feedback Questions Table
CREATE TABLE IF NOT EXISTS `feedback_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_text` TEXT NOT NULL,
  `question_type` VARCHAR(50) DEFAULT 'rating',
  `display_order` INT DEFAULT 1,
  `required` TINYINT(1) DEFAULT 1,
  `status` ENUM('active', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Feedback Answers Table
CREATE TABLE IF NOT EXISTS `feedback_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `submission_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `faculty_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `answer_text` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`submission_id`) REFERENCES `feedback_submissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `feedback_questions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
