import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'visiondesk_database',
  password: process.env.DB_PASSWORD || 'Steak',
  port: process.env.DB_PORT || 5432,
});

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, company_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
      [email, hashedPassword, name, role, company_id]
    );
    
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials here' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER CRUD ROUTES ====================

// Get all users (Admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(`
      SELECT u.*, c.name as company_name 
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id 
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own data unless they're admin
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT u.*, c.name as company_name 
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id 
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (Admin only)
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, password, name, role, company_id, is_active = true } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password, name, role, company_id, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, name, role, company_id, is_active, created_at`,
      [email, hashedPassword, name, role, company_id, is_active]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, company_id, is_active } = req.body;
    
    // Users can only update their own data unless they're admin
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, role = $2, company_id = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING id, email, name, role, company_id, is_active, created_at`,
      [name, role, company_id, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this to your server.js after the login route
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, company_id, is_active FROM users WHERE id = $1 AND is_active = true',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPANY CRUD ROUTES ====================

// Get all companies
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get company by ID
app.get('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create company (Admin only)
app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, contact_email, phone, address } = req.body;
    
    const result = await pool.query(
      `INSERT INTO companies (name, contact_email, phone, address) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, contact_email, phone, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update company (Admin only)
app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { name, contact_email, phone, address } = req.body;
    
    const result = await pool.query(
      `UPDATE companies 
       SET name = $1, contact_email = $2, phone = $3, address = $4 
       WHERE id = $5 
       RETURNING *`,
      [name, contact_email, phone, address, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete company (Admin only)
app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    // Check if company has users
    const usersResult = await pool.query('SELECT id FROM users WHERE company_id = $1', [id]);
    if (usersResult.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete company with associated users' });
    }
    
    const result = await pool.query('DELETE FROM companies WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROJECT CRUD ROUTES ====================

// Get all projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT p.*, c.name as client_company_name, u.name as admin_name
      FROM projects p 
      LEFT JOIN companies c ON p.client_company_id = c.id 
      LEFT JOIN users u ON p.admin_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (req.user.role === 'client') {
      const companyResult = await pool.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
      query += ' AND p.client_company_id = $1';
      params.push(companyResult.rows[0]?.company_id);
    } else if (req.user.role === 'developer') {
      // Developers see projects they have tasks in
      query += ` AND p.id IN (
        SELECT DISTINCT project_id FROM tasks WHERE assigned_to = $1
      )`;
      params.push(req.user.id);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project by ID
app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT p.*, c.name as client_company_name, u.name as admin_name
      FROM projects p 
      LEFT JOIN companies c ON p.client_company_id = c.id 
      LEFT JOIN users u ON p.admin_id = u.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access permissions
    const project = result.rows[0];
    if (req.user.role === 'client') {
      const companyResult = await pool.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
      if (project.client_company_id !== companyResult.rows[0]?.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project (Admin only)
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    // FIX: Changed from OR to AND
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, client_company_id, deadline, status = 'active' } = req.body;
    
    const result = await pool.query(
      `INSERT INTO projects (name, description, client_company_id, admin_id, deadline, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description, client_company_id, req.user.id, deadline, status]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update project (Admin only)
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { name, description, client_company_id, deadline, status } = req.body;
    
    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, description = $2, client_company_id = $3, deadline = $4, status = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [name, description, client_company_id, deadline, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete project (Admin only)
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    // FIX: Changed from OR to AND
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    // Check if project has tasks
    const tasksResult = await pool.query('SELECT id FROM tasks WHERE project_id = $1', [id]);
    if (tasksResult.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete project with associated tasks' });
    }
    
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TASK CRUD ROUTES ====================

// Get all tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT t.*, u.name as assigned_name, p.name as project_name, p.id as project_id
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_to = u.id 
      LEFT JOIN projects p ON t.project_id = p.id 
      WHERE 1=1
    `;
    const params = [];
    
    // Role-based filtering
    if (req.user.role === 'developer') {
      query += ' AND t.assigned_to = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'client') {
      query += ' AND p.client_company_id = $1';
      const companyResult = await pool.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
      params.push(companyResult.rows[0]?.company_id);
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT t.*, u.name as assigned_name, p.name as project_name, p.id as project_id
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_to = u.id 
      LEFT JOIN projects p ON t.project_id = p.id 
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check access permissions
    const task = result.rows[0];
    if (req.user.role === 'developer' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task (Admin only)
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    // FIX: Changed from OR to AND
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, description, project_id, assigned_to, priority = 'medium', deadline, status = 'not_started', progress_percentage = 0 } = req.body;
    
    const result = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, priority, deadline, status, progress_percentage, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [title, description, project_id, assigned_to, priority, deadline, status, progress_percentage, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, priority, deadline, status, progress_percentage } = req.body;
    
    // Check if user has permission to update this task
    if (req.user.role === 'developer') {
      const taskResult = await pool.query('SELECT assigned_to FROM tasks WHERE id = $1', [id]);
      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      if (taskResult.rows[0].assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const result = await pool.query(
      `UPDATE tasks 
       SET title = $1, description = $2, assigned_to = $3, priority = $4, deadline = $5, status = $6, progress_percentage = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 
       RETURNING *`,
      [title, description, assigned_to, priority, deadline, status, progress_percentage, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task (Admin only)
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    // FIX: Changed from OR to AND
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SUB-TASK CRUD ROUTES ====================

// Get sub-tasks for a task
app.get('/api/tasks/:taskId/subtasks', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(`
      SELECT st.*, u.name as created_by_name
      FROM sub_tasks st
      LEFT JOIN users u ON st.created_by = u.id
      WHERE st.task_id = $1
      ORDER BY st.created_at DESC
    `, [taskId]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sub-task
app.post('/api/tasks/:taskId/subtasks', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sub_tasks (task_id, title, description, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [taskId, title, description, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update sub-task
app.put('/api/subtasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, approved } = req.body;
    
    const result = await pool.query(
      `UPDATE sub_tasks 
       SET title = $1, description = $2, status = $3, approved = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [title, description, status, approved, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete sub-task
app.delete('/api/subtasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM sub_tasks WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-task not found' });
    }
    
    res.json({ message: 'Sub-task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMMENT ROUTES ====================

// Get comments for a project or task
app.get('/api/comments', authenticateToken, async (req, res) => {
  try {
    const { project_id, task_id } = req.query;
    
    if (!project_id && !task_id) {
      return res.status(400).json({ error: 'Either project_id or task_id is required' });
    }

    let query = `
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (project_id) {
      query += ' AND c.project_id = $1';
      params.push(project_id);
    } else if (task_id) {
      query += ' AND c.task_id = $1';
      params.push(task_id);
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create comment (Client only)
app.post('/api/comments', authenticateToken, async (req, res) => {
  try {
    // Only clients can create comments
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can create comments' });
    }

    const { content, project_id, task_id } = req.body;

    // Validate that either project_id or task_id is provided, but not both
    if ((!project_id && !task_id) || (project_id && task_id)) {
      return res.status(400).json({ error: 'Either project_id or task_id must be provided, but not both' });
    }

    // Verify that the client has access to the project/task
    if (project_id) {
      const projectCheck = await pool.query(
        `SELECT p.* FROM projects p 
         JOIN users u ON p.client_company_id = u.company_id 
         WHERE p.id = $1 AND u.id = $2`,
        [project_id, req.user.id]
      );
      if (projectCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    } else if (task_id) {
      const taskCheck = await pool.query(
        `SELECT t.* FROM tasks t 
         JOIN projects p ON t.project_id = p.id 
         JOIN users u ON p.client_company_id = u.company_id 
         WHERE t.id = $1 AND u.id = $2`,
        [task_id, req.user.id]
      );
      if (taskCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this task' });
      }
    }

    const result = await pool.query(
      `INSERT INTO comments (content, author_id, project_id, task_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [content, req.user.id, project_id, task_id]
    );

    // Fetch the comment with author details
    const commentWithAuthor = await pool.query(`
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(commentWithAuthor.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update comment (Client only - only their own comments)
app.put('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if comment exists and user is the author
    const commentCheck = await pool.query(
      'SELECT * FROM comments WHERE id = $1 AND author_id = $2',
      [id, req.user.id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or access denied' });
    }

    const result = await pool.query(
      `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [content, id]
    );

    // Fetch the updated comment with author details
    const commentWithAuthor = await pool.query(`
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
    `, [id]);

    res.json(commentWithAuthor.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete comment (Client only - only their own comments, or Admin)
app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    let commentCheck;
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      commentCheck = await pool.query('SELECT * FROM comments WHERE id = $1', [id]);
    } else {
      commentCheck = await pool.query(
        'SELECT * FROM comments WHERE id = $1 AND author_id = $2',
        [id, req.user.id]
      );
    }

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or access denied' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK & DEBUG ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Debug endpoint to check users
app.get('/api/debug/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, password FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database connection test
app.get('/api/debug/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.json({
      database: 'Connected ✅',
      currentTime: result.rows[0].current_time,
      postgresVersion: result.rows[0].postgres_version,
      tables: tables.rows.map(row => row.table_name)
    });
  } catch (error) {
    res.status(500).json({
      database: 'Connection failed ❌',
      error: error.message
    });
  }
});

// Test route to verify ratings endpoint
app.get('/api/ratings/test', (req, res) => {
  res.json({ message: 'Ratings endpoint is working!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⭐ Ratings test: http://localhost:${PORT}/api/ratings/test`);
  console.log(`🌟 Ratings dashboard: http://localhost:${PORT}/api/ratings/dashboard/summary`);
});