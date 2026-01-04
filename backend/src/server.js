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

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

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

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
      name, 
      description, 
      client_company_id, 
      deadline, 
      status = 'active',
      project_document, 
      document_name, 
      document_type, 
      document_size 
    } = req.body;

    console.log('Received project data:', {
      name,
      description,
      client_company_id,
      document_name,
      document_type,
      document_size,
      project_document_length: project_document ? project_document.length : 0,
      project_document_type: typeof project_document
    });

    if (!name || !description || !client_company_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let documentBuffer = null;
    if (project_document) {
      try {
        if (typeof project_document === 'string' && project_document.length > 0) {
          documentBuffer = Buffer.from(project_document, 'base64');
          console.log('Document buffer created, length:', documentBuffer.length);
        } else {
          console.log('Invalid project_document format:', typeof project_document);
        }
      } catch (error) {
        console.error('Error creating document buffer:', error);
      }
    }

    const result = await pool.query(
      `INSERT INTO projects (
        name, description, client_company_id, admin_id, deadline, status,
        project_document, document_name, document_type, document_size
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        name, 
        description, 
        client_company_id, 
        req.user.id, 
        deadline, 
        status,
        documentBuffer, 
        document_name,
        document_type,
        document_size
      ]
    );

    console.log('Project created successfully, ID:', result.rows[0].id);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { 
      name, 
      description, 
      client_company_id, 
      deadline, 
      status,
      project_document, 
      document_name, 
      document_type, 
      document_size,
      remove_document = false 
    } = req.body;
    
    let query;
    let params;
    
    if (remove_document) {
      
      query = `
        UPDATE projects 
        SET name = $1, description = $2, client_company_id = $3, deadline = $4, status = $5, 
            project_document = NULL, document_name = NULL, document_type = NULL, document_size = NULL,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = $6 
        RETURNING *
      `;
      params = [name, description, client_company_id, deadline, status, id];
    } else if (project_document) {
      
      query = `
        UPDATE projects 
        SET name = $1, description = $2, client_company_id = $3, deadline = $4, status = $5,
            project_document = $6, document_name = $7, document_type = $8, document_size = $9,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = $10 
        RETURNING *
      `;
      params = [
        name, 
        description, 
        client_company_id, 
        deadline, 
        status,
        Buffer.from(project_document, 'base64'),
        document_name,
        document_type,
        document_size,
        id
      ];
    } else {
    
      query = `
        UPDATE projects 
        SET name = $1, description = $2, client_company_id = $3, deadline = $4, status = $5, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = $6 
        RETURNING *
      `;
      params = [name, description, client_company_id, deadline, status, id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.get('/api/projects/:id/document', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT project_document, document_name, document_type, document_size 
       FROM projects 
       WHERE id = $1 AND project_document IS NOT NULL`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const project = result.rows[0];
    
    
    const projectCheck = await pool.query(
      `SELECT p.* FROM projects p 
       WHERE p.id = $1 AND (
         p.client_company_id = (SELECT company_id FROM users WHERE id = $2) OR
         $3 IN ('admin', 'manager') OR
         p.id IN (SELECT project_id FROM tasks WHERE assigned_to = $2)
       )`,
      [id, req.user.id, req.user.role]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    
    const documentData = {
      document: project.project_document.toString('base64'),
      name: project.document_name,
      type: project.document_type,
      size: project.document_size
    };
    
    res.json(documentData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete('/api/projects/:id/document', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE projects 
       SET project_document = NULL, document_name = NULL, document_type = NULL, document_size = NULL,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
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

app.get('/api/projects/:id/download', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const result = await pool.query(
      `SELECT document_name, document_type, project_document 
       FROM projects WHERE id = $1`,
      [projectId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].project_document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const project = result.rows[0];
    
    
    res.setHeader('Content-Type', project.document_type || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${project.document_name || 'document.pdf'}"`);
    
    
    res.send(project.project_document);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: error.message });
  }
});




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
      return res.status(401).json({ error: 'Invalid credentials' });
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




app.get('/api/projects/:projectId/ratings', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    
    const projectCheck = await pool.query(
      `SELECT p.* FROM projects p 
       WHERE p.id = $1 AND (
         p.client_company_id = (SELECT company_id FROM users WHERE id = $2) OR
         $3 IN ('admin', 'manager') OR
         p.id IN (SELECT project_id FROM tasks WHERE assigned_to = $2)
       )`,
      [projectId, req.user.id, req.user.role]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    const result = await pool.query(`
      SELECT pr.*, u.name as user_name, u.role as user_role
      FROM project_ratings pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.project_id = $1
      ORDER BY pr.created_at DESC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/projects/:projectId/ratings', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { rating, comment, would_recommend } = req.body;
    
    
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can rate projects' });
    }
    
    
    const projectCheck = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND client_company_id = (SELECT company_id FROM users WHERE id = $2)',
      [projectId, req.user.id]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    
    const existingRating = await pool.query(
      'SELECT * FROM project_ratings WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );
    
    let result;
    if (existingRating.rows.length > 0) {
      
      result = await pool.query(
        `UPDATE project_ratings 
         SET rating = $1, comment = $2, would_recommend = $3, updated_at = CURRENT_TIMESTAMP 
         WHERE project_id = $4 AND user_id = $5 
         RETURNING *`,
        [rating, comment, would_recommend, projectId, req.user.id]
      );
    } else {
      
      result = await pool.query(
        `INSERT INTO project_ratings (project_id, user_id, rating, comment, would_recommend) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [projectId, req.user.id, rating, comment, would_recommend]
      );
    }
    
    
    const ratingWithUser = await pool.query(`
      SELECT pr.*, u.name as user_name, u.role as user_role
      FROM project_ratings pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json(ratingWithUser.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.get('/api/tasks/:taskId/ratings', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    
    const taskCheck = await pool.query(
      `SELECT t.* FROM tasks t 
       WHERE t.id = $1 AND (
         t.assigned_to = $2 OR
         $3 IN ('admin', 'manager') OR
         t.project_id IN (SELECT id FROM projects WHERE client_company_id = (SELECT company_id FROM users WHERE id = $2))
       )`,
      [taskId, req.user.id, req.user.role]
    );
    
    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    const result = await pool.query(`
      SELECT tr.*, u.name as user_name, u.role as user_role
      FROM task_ratings tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.task_id = $1
      ORDER BY tr.created_at DESC
    `, [taskId]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/tasks/:taskId/ratings', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { rating, comment, rating_type = 'quality' } = req.body;
    
    
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can rate tasks' });
    }
    
    
    const taskCheck = await pool.query(
      `SELECT t.* FROM tasks t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.id = $1 AND p.client_company_id = (SELECT company_id FROM users WHERE id = $2)`,
      [taskId, req.user.id]
    );
    
    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    
    const existingRating = await pool.query(
      'SELECT * FROM task_ratings WHERE task_id = $1 AND user_id = $2 AND rating_type = $3',
      [taskId, req.user.id, rating_type]
    );
    
    let result;
    if (existingRating.rows.length > 0) {
      
      result = await pool.query(
        `UPDATE task_ratings 
         SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE task_id = $3 AND user_id = $4 AND rating_type = $5 
         RETURNING *`,
        [rating, comment, taskId, req.user.id, rating_type]
      );
    } else {
      
      result = await pool.query(
        `INSERT INTO task_ratings (task_id, user_id, rating, comment, rating_type) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [taskId, req.user.id, rating, comment, rating_type]
      );
    }
    
    
    const ratingWithUser = await pool.query(`
      SELECT tr.*, u.name as user_name, u.role as user_role
      FROM task_ratings tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json(ratingWithUser.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.delete('/api/projects/:projectId/ratings/:ratingId', authenticateToken, async (req, res) => {
  try {
    const { projectId, ratingId } = req.params;
    
    
    const ratingCheck = await pool.query(
      'SELECT * FROM project_ratings WHERE id = $1 AND project_id = $2',
      [ratingId, projectId]
    );
    
    if (ratingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && ratingCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await pool.query('DELETE FROM project_ratings WHERE id = $1', [ratingId]);
    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete('/api/tasks/:taskId/ratings/:ratingId', authenticateToken, async (req, res) => {
  try {
    const { taskId, ratingId } = req.params;
    
    
    const ratingCheck = await pool.query(
      'SELECT * FROM task_ratings WHERE id = $1 AND task_id = $2',
      [ratingId, taskId]
    );
    
    if (ratingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && ratingCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await pool.query('DELETE FROM task_ratings WHERE id = $1', [ratingId]);
    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




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


app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
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


app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, company_id, is_active } = req.body;
    
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


app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
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




app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


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


app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
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
    
    const task = result.rows[0];
    if (req.user.role === 'developer' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
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


app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, priority, deadline, status, progress_percentage } = req.body;
    
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


app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
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


app.get('/api/ratings/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const projectRatingsAggregate = await pool.query(`
      SELECT 
        COALESCE(AVG(rating)::numeric, 0.00) as average_rating,
        COUNT(*) as total_ratings,
        COUNT(DISTINCT project_id) as projects_rated,
        COUNT(DISTINCT user_id) as unique_raters
      FROM project_ratings
    `);

  
    const taskRatingsAggregate = await pool.query(`
      SELECT 
        COALESCE(AVG(rating)::numeric, 0.00) as average_rating,
        COUNT(*) as total_ratings,
        COUNT(DISTINCT task_id) as tasks_rated,
        COUNT(DISTINCT user_id) as unique_raters
      FROM task_ratings
    `);

    const recentProjectRatings = await pool.query(`
      SELECT 
        pr.*,
        p.name as project_name,
        u.name as user_name,
        u.role as user_role
      FROM project_ratings pr
      JOIN projects p ON pr.project_id = p.id
      JOIN users u ON pr.user_id = u.id
      ORDER BY pr.created_at DESC
      LIMIT 10
    `);
    
    const recentTaskRatings = await pool.query(`
      SELECT 
        tr.*,
        t.title as task_title,
        p.name as project_name,
        u.name as user_name,
        u.role as user_role
      FROM task_ratings tr
      JOIN tasks t ON tr.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON tr.user_id = u.id
      ORDER BY tr.created_at DESC
      LIMIT 10
    `);

    res.json({
      project_ratings: {
        average_rating: parseFloat(projectRatingsAggregate.rows[0]?.average_rating || 0),
        total_ratings: parseInt(projectRatingsAggregate.rows[0]?.total_ratings || 0),
        projects_rated: parseInt(projectRatingsAggregate.rows[0]?.projects_rated || 0),
        unique_raters: parseInt(projectRatingsAggregate.rows[0]?.unique_raters || 0)
      },
      task_ratings: {
        average_rating: parseFloat(taskRatingsAggregate.rows[0]?.average_rating || 0),
        total_ratings: parseInt(taskRatingsAggregate.rows[0]?.total_ratings || 0),
        tasks_rated: parseInt(taskRatingsAggregate.rows[0]?.tasks_rated || 0),
        unique_raters: parseInt(taskRatingsAggregate.rows[0]?.unique_raters || 0)
      },
      recent_project_ratings: recentProjectRatings.rows,
      recent_task_ratings: recentTaskRatings.rows
    });

  } catch (error) {
    console.error('Error fetching ratings dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});


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


app.get('/api/ratings/test', (req, res) => {
  res.json({ message: 'Ratings endpoint is working!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⭐ Ratings test: http://localhost:${PORT}/api/ratings/test`);
});
