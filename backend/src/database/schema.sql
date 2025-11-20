-- Companies table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'developer', 'client', 'manager')) NOT NULL,
    company_id INTEGER REFERENCES companies(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_company_id INTEGER REFERENCES companies(id),
    admin_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    project_id INTEGER REFERENCES projects(id),
    assigned_to INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'not_started',
    priority VARCHAR(20) DEFAULT 'medium',
    progress_percentage INTEGER DEFAULT 0,
    deadline DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sub-tasks table
CREATE TABLE sub_tasks (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'not_started',
    created_by INTEGER REFERENCES users(id),
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Ratings & Comments table (combined)
CREATE TABLE project_ratings (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)  -- One rating per user per project
);

-- Task Ratings & Comments table (combined)
CREATE TABLE task_ratings (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    rating_type VARCHAR(50) DEFAULT 'overall', -- overall, quality, communication, timeliness, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id, rating_type)  -- One rating per type per user per task
);

-- Add average rating columns to projects and tasks for quick access
ALTER TABLE projects ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE projects ADD COLUMN total_ratings INTEGER DEFAULT 0;

ALTER TABLE tasks ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE tasks ADD COLUMN total_ratings INTEGER DEFAULT 0;

-- Insert sample data
INSERT INTO companies (name, contact_email) VALUES 
('Tech Solutions Inc', 'contact@techsolutions.com'),
('Web Innovations LLC', 'info@webinnovations.com');
('T&T Group(Pty)Ltd', 'admin@tandtgroup.co.za')

INSERT INTO users (email, password, name, role, company_id) VALUES 
('admin@visiondesk.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thandeka', 'admin', 3),
('dev@visiondesk.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thabang', 'developer', 3),
('client@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Someone', 'client', 1);
('manager@visiondesk.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mr Mpheti', 'manager', 3);


-- Insert sample projects
INSERT INTO projects (name, description, client_company_id, admin_id, status, deadline) VALUES 
('E-commerce Website', 'Build a modern e-commerce platform with React and Node.js', 1, 1, 'active', '2024-12-31'),
('Mobile App Development', 'Develop a cross-platform mobile application', 2, 1, 'active', '2024-11-30');

-- Insert sample tasks
INSERT INTO tasks (title, description, project_id, assigned_to, status, priority, progress_percentage, deadline, created_by) VALUES 
('Design Homepage', 'Create responsive homepage design with modern UI', 1, 2, 'completed', 'high', 100, '2024-09-30', 1),
('Implement Payment Gateway', 'Integrate Stripe payment processing', 1, 2, 'in_progress', 'high', 75, '2024-10-15', 1),
('User Authentication', 'Build login and registration system', 2, 2, 'not_started', 'medium', 0, '2024-10-20', 1);

-- Insert sample ratings with comments
INSERT INTO project_ratings (project_id, user_id, rating, comment, would_recommend) VALUES 
(1, 3, 5, 'Excellent communication and timely delivery. The team was very professional and understood our requirements perfectly. The final product exceeded our expectations!', true),
(2, 3, 4, 'Good work overall. There were some minor issues during development but the team was quick to resolve them. Would work with them again.', true);

INSERT INTO task_ratings (task_id, user_id, rating, comment, rating_type) VALUES 
(1, 3, 5, 'Perfect implementation of the design. The homepage looks exactly as we envisioned and the performance is excellent. Very satisfied with the attention to detail.', 'overall'),
(1, 3, 4, 'Good communication throughout the task. The developer kept us updated on progress and asked clarifying questions when needed.', 'communication'),
(2, 3, 3, 'Progress is steady but we are experiencing some delays in the payment gateway integration. Hoping to see this resolved soon.', 'timeliness'),
(2, 3, 4, 'The technical implementation looks solid so far. The code is clean and well-structured.', 'quality');

-- Create indexes for better performance
CREATE INDEX idx_project_ratings_project_id ON project_ratings(project_id);
CREATE INDEX idx_project_ratings_user_id ON project_ratings(user_id);
CREATE INDEX idx_task_ratings_task_id ON task_ratings(task_id);
CREATE INDEX idx_task_ratings_user_id ON task_ratings(user_id);

-- Create function to update project average rating
CREATE OR REPLACE FUNCTION update_project_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET average_rating = (
        SELECT AVG(rating) FROM project_ratings WHERE project_id = NEW.project_id
    ),
    total_ratings = (
        SELECT COUNT(*) FROM project_ratings WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update task average rating
CREATE OR REPLACE FUNCTION update_task_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tasks 
    SET average_rating = (
        SELECT AVG(rating) FROM task_ratings WHERE task_id = NEW.task_id
    ),
    total_ratings = (
        SELECT COUNT(*) FROM task_ratings WHERE task_id = NEW.task_id
    )
    WHERE id = NEW.task_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update ratings
CREATE TRIGGER trigger_update_project_rating
    AFTER INSERT OR UPDATE OR DELETE ON project_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_project_rating();

CREATE TRIGGER trigger_update_task_rating
    AFTER INSERT OR UPDATE OR DELETE ON task_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_task_rating();