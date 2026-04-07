import Database from 'better-sqlite3';
import path from 'path';

// Connect to SQLite database
const db = new Database('database.sqlite');
db.pragma('journal_mode = WAL');

// Initial setup: Create tables if they do not exist
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      company TEXT,
      adminId INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (adminId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      internshipId INTEGER NOT NULL,
      coverLetter TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES users(id),
      FOREIGN KEY (internshipId) REFERENCES internships(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      internshipId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      deadline DATETIME,
      FOREIGN KEY (internshipId) REFERENCES internships(id)
    );

    CREATE TABLE IF NOT EXISTS student_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      taskId INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      report TEXT,
      completedAt DATETIME,
      FOREIGN KEY (studentId) REFERENCES users(id),
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      internshipId INTEGER NOT NULL,
      mentorId INTEGER NOT NULL,
      feedbackText TEXT,
      score INTEGER CHECK(score >= 0 AND score <= 100),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES users(id),
      FOREIGN KEY (internshipId) REFERENCES internships(id),
      FOREIGN KEY (mentorId) REFERENCES users(id)
    );
  `);
}

initDb();

export default db;
