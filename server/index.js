import express from 'express';
import cors from 'cors';
import db from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'nexturn_secret_key_dev'; // In production, use environment variable

// Setup uploads directory
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Serve frontend static files
const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// --- Routes ---

// 1. Auth routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Insert user
    const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, email, hashedPassword, role);
    
    const token = jwt.sign({ id: info.lastInsertRowid, email, role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ 
      token, 
      user: { id: info.lastInsertRowid, name, email, role } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// 2. Internship Routes
app.get('/api/internships', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT i.*, u.name as adminName 
      FROM internships i 
      JOIN users u ON i.adminId = u.id 
    `;
    if (req.user.role === 'student') {
      query += ` WHERE i.status = 'active' `;
    }
    query += ` ORDER BY i.id DESC`;
    
    const internships = db.prepare(query).all();
    res.json(internships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/internships/:id/status', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { status } = req.body;
    const internshipId = req.params.id;
    
    const internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(internshipId);
    if (!internship || internship.adminId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    db.prepare('UPDATE internships SET status = ? WHERE id = ?').run(status, internshipId);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/internships', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { title, description, company } = req.body;
    const stmt = db.prepare('INSERT INTO internships (title, description, company, adminId) VALUES (?, ?, ?, ?)');
    const info = stmt.run(title, description, company, req.user.id);
    res.status(201).json({ id: info.lastInsertRowid, title, description, company, adminId: req.user.id, status: 'active' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Application Routes
app.post('/api/applications', authenticateToken, upload.single('resume'), (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can apply.' });
  try {
    const { internshipId, coverLetter } = req.body;
    let resumeUrl = null;
    if (req.file) {
      resumeUrl = '/uploads/' + req.file.filename;
    }

    // Check if already applied
    const existing = db.prepare('SELECT * FROM applications WHERE studentId = ? AND internshipId = ?').get(req.user.id, internshipId);
    if (existing) return res.status(400).json({ error: 'Already applied to this internship.' });

    const stmt = db.prepare('INSERT INTO applications (studentId, internshipId, coverLetter, resumeUrl) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.user.id, internshipId, coverLetter, resumeUrl);
    res.status(201).json({ id: info.lastInsertRowid, status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'student') {
      const applications = db.prepare(`
        SELECT a.*, i.title, i.company, u.name as adminName 
        FROM applications a 
        JOIN internships i ON a.internshipId = i.id 
        JOIN users u ON i.adminId = u.id 
        WHERE a.studentId = ?
      `).all(req.user.id);
      res.json(applications);
    } else {
      // Admin sees applications for their internships
      const applications = db.prepare(`
        SELECT a.*, u.name as studentName, u.email as studentEmail, i.title as internshipTitle
        FROM applications a 
        JOIN internships i ON a.internshipId = i.id 
        JOIN users u ON a.studentId = u.id 
        WHERE i.adminId = ?
      `).all(req.user.id);
      res.json(applications);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/applications/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const appId = req.params.id;
    
    // Verify admin owns this internship
    const application = db.prepare(`
      SELECT a.*, i.adminId 
      FROM applications a JOIN internships i ON a.internshipId = i.id 
      WHERE a.id = ?
    `).get(appId);
    
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.adminId !== req.user.id) return res.status(403).json({ error: 'Not authorized for this internship' });

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, appId);
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Tasks Routes
app.post('/api/tasks', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { internshipId, title, description, deadline, assignedStudentIds } = req.body;
    
    // Insert task
    const stmt = db.prepare('INSERT INTO tasks (internshipId, title, description, deadline) VALUES (?, ?, ?, ?)');
    const info = stmt.run(internshipId, title, description, deadline);
    const taskId = info.lastInsertRowid;

    // Assign to students
    if (assignedStudentIds && assignedStudentIds.length > 0) {
      const assignStmt = db.prepare('INSERT INTO student_tasks (studentId, taskId) VALUES (?, ?)');
      const insertMany = db.transaction((ids) => {
        for (const id of ids) assignStmt.run(id, taskId);
      });
      insertMany(assignedStudentIds);
    }

    res.status(201).json({ id: taskId, message: 'Task created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'student') {
      const tasks = db.prepare(`
        SELECT st.id as studentTaskId, st.status as completionStatus, st.report, st.fileUrl, st.completedAt, 
               t.id as taskId, t.title, t.description, t.deadline, i.title as internshipTitle
        FROM student_tasks st
        JOIN tasks t ON st.taskId = t.id
        JOIN internships i ON t.internshipId = i.id
        WHERE st.studentId = ?
      `).all(req.user.id);
      res.json(tasks);
    } else {
      // Admin sees tasks they've created and student completions
      const tasks = db.prepare(`
        SELECT st.id as studentTaskId, st.status as completionStatus, st.studentId, u.name as studentName,
               st.report, st.fileUrl,
               t.id as taskId, t.title, t.description, t.deadline, i.title as internshipTitle
        FROM tasks t
        LEFT JOIN student_tasks st ON t.id = st.taskId
        LEFT JOIN users u ON st.studentId = u.id
        JOIN internships i ON t.internshipId = i.id
        WHERE i.adminId = ?
      `).all(req.user.id);
      res.json(tasks);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:studentTaskId/status', authenticateToken, upload.single('taskFile'), (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { status, report } = req.body;
    const studentTaskId = req.params.studentTaskId;
    
    let fileUrl = null;
    if (req.file) {
      fileUrl = '/uploads/' + req.file.filename;
    }
    
    // Verify ownership
    const st = db.prepare('SELECT studentId FROM student_tasks WHERE id = ?').get(studentTaskId);
    if (!st || st.studentId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    db.prepare('UPDATE student_tasks SET status = ?, report = ?, fileUrl = COALESCE(?, fileUrl), completedAt = CURRENT_TIMESTAMP WHERE id = ?').run(status, report || null, fileUrl, studentTaskId);
    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Feedback Routes
app.post('/api/feedback', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { studentId, internshipId, feedbackText, score } = req.body;
    const stmt = db.prepare('INSERT INTO feedback (studentId, internshipId, mentorId, feedbackText, score) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(studentId, internshipId, req.user.id, feedbackText, score);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/feedback', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'student') {
      const feedback = db.prepare(`
        SELECT f.*, i.title as internshipTitle, u.name as mentorName
        FROM feedback f
        JOIN internships i ON f.internshipId = i.id
        JOIN users u ON f.mentorId = u.id
        WHERE f.studentId = ?
      `).all(req.user.id);
      res.json(feedback);
    } else {
      // Admin sees feedback they've given
      const feedback = db.prepare(`
        SELECT f.*, i.title as internshipTitle, u.name as studentName
        FROM feedback f
        JOIN internships i ON f.internshipId = i.id
        JOIN users u ON f.studentId = u.id
        WHERE f.mentorId = ?
      `).all(req.user.id);
      res.json(feedback);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.send('NexTurn API is running 🚀');
});

// React Router fallback (must be the LAST route before listen)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
