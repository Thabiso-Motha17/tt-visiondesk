CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


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


CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_company_id INTEGER REFERENCES companies(id),
    admin_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    deadline DATE,
    
    
    project_document BYTEA, 
    document_name VARCHAR(255),
    document_type VARCHAR(50),
    document_size INTEGER,
    uploaded_at TIMESTAMP,
    
   
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


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
    
    
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


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


CREATE TABLE project_ratings (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)  
);


CREATE TABLE task_ratings (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    rating_type VARCHAR(50) DEFAULT 'overall', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id, rating_type)  
);


INSERT INTO companies (name, contact_email, phone, address) VALUES 
('Tech Solutions Inc', 'contact@techsolutions.com', '+1-555-1234', '123 Tech Street, San Francisco, CA'),
('Web Innovations LLC', 'info@webinnovations.com', '+1-555-5678', '456 Web Avenue, New York, NY'),
('T&T Group(Pty)Ltd', 'admin@tandtgroup.co.za', '+27-11-555-1234', '789 Business Road, Johannesburg, South Africa');


INSERT INTO users (email, password, name, role, company_id) VALUES 
('admin@visiondesk.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thandeka', 'admin', 3),
('dev@visiondesk.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thabang', 'developer', 3),
('client@techsolutions.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Johnson', 'client', 1),
('client@webinnovations.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Michael Chen', 'client', 2),
('manager@visiondesk.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mr Mpheti', 'manager', 3),
('developer2@visiondesk.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lerato', 'developer', 3);


INSERT INTO projects (name, description, client_company_id, admin_id, status, deadline, document_name, document_type, document_size, uploaded_at) VALUES 
('E-commerce Website', 'Build a modern e-commerce platform with React and Node.js', 1, 1, 'active', '2024-12-31', 'project-brief.pdf', 'application/pdf', 2048576, '2024-01-15 09:30:00'),
('Mobile App Development', 'Develop a cross-platform mobile application for iOS and Android', 2, 5, 'active', '2024-11-30', 'app-requirements.pdf', 'application/pdf', 1572864, '2024-01-10 14:15:00'),
('CRM System', 'Custom CRM solution for sales team management', 1, 1, 'in_progress', '2024-10-31', 'crm-specs.pdf', 'application/pdf', 3145728, '2024-02-01 10:00:00'),
('Website Redesign', 'Complete redesign of company website with modern UI/UX', 2, 5, 'completed', '2024-09-15', NULL, NULL, NULL, NULL),
('API Integration', 'Third-party API integration and data synchronization', 1, 5, 'active', '2024-12-15', 'api-documentation.pdf', 'application/pdf', 1048576, '2024-01-20 16:45:00');


INSERT INTO tasks (title, description, project_id, assigned_to, status, priority, progress_percentage, deadline, created_by) VALUES 
('Design Homepage', 'Create responsive homepage design with modern UI', 1, 2, 'completed', 'high', 100, '2024-09-30', 1),
('Implement Payment Gateway', 'Integrate Stripe payment processing', 1, 6, 'in_progress', 'high', 75, '2024-10-15', 1),
('User Authentication', 'Build login and registration system', 2, 2, 'completed', 'medium', 100, '2024-10-20', 5),
('Mobile UI Design', 'Design mobile application user interface', 2, 6, 'in_progress', 'medium', 60, '2024-10-10', 5),
('Database Schema', 'Design and implement database structure', 3, 2, 'completed', 'medium', 100, '2024-09-25', 1),
('Backend API Development', 'Create RESTful APIs for CRM', 3, 6, 'in_progress', 'high', 40, '2024-10-20', 1),
('Frontend Development', 'Build React frontend for CRM', 3, 2, 'not_started', 'medium', 0, '2024-11-15', 5),
('Content Migration', 'Migrate existing content to new website', 4, 6, 'completed', 'low', 100, '2024-08-15', 5),
('SEO Optimization', 'Optimize website for search engines', 4, 2, 'completed', 'medium', 100, '2024-08-31', 1),
('API Documentation', 'Create comprehensive API documentation', 5, 6, 'in_progress', 'medium', 50, '2024-11-30', 5);


INSERT INTO sub_tasks (task_id, title, description, status, created_by, approved) VALUES 
(1, 'Wireframe Design', 'Create wireframes for homepage layout', 'completed', 2, true),
(1, 'Color Scheme Selection', 'Choose primary and secondary colors', 'completed', 2, true),
(2, 'Stripe Setup', 'Configure Stripe account and API keys', 'completed', 6, true),
(2, 'Payment Form', 'Design secure payment form', 'in_progress', 6, false),
(3, 'Login Form', 'Create user login interface', 'completed', 2, true),
(3, 'Password Reset', 'Implement password reset functionality', 'completed', 2, true),
(4, 'Home Screen Design', 'Design main app home screen', 'completed', 6, true),
(4, 'Navigation Menu', 'Create app navigation structure', 'in_progress', 6, false);


INSERT INTO project_ratings (project_id, user_id, rating, comment, would_recommend) VALUES 
(1, 3, 5, 'Excellent communication and timely delivery. The team was very professional and understood our requirements perfectly. The final product exceeded our expectations!', true),
(1, 4, 4, 'Good work overall. There were some minor issues during development but the team was quick to resolve them. Would work with them again.', true),
(2, 4, 5, 'Outstanding mobile app development. The team delivered ahead of schedule and the quality is exceptional.', true),
(3, 3, 4, 'CRM system is working well. Good customization options and reliable performance.', true),
(4, 3, 5, 'Website redesign transformed our online presence. Very happy with the results!', true),
(4, 4, 3, 'Design was good but there were some delays in the timeline.', true);


INSERT INTO task_ratings (task_id, user_id, rating, comment, rating_type) VALUES 
(1, 3, 5, 'Perfect implementation of the design. The homepage looks exactly as we envisioned and the performance is excellent. Very satisfied with the attention to detail.', 'overall'),
(1, 3, 4, 'Good communication throughout the task. The developer kept us updated on progress and asked clarifying questions when needed.', 'communication'),
(2, 3, 3, 'Progress is steady but we are experiencing some delays in the payment gateway integration. Hoping to see this resolved soon.', 'timeliness'),
(2, 3, 4, 'The technical implementation looks solid so far. The code is clean and well-structured.', 'quality'),
(3, 4, 5, 'Authentication system works flawlessly. Very secure and user-friendly.', 'overall'),
(4, 4, 4, 'Mobile UI design is modern and intuitive. Looking forward to the final product.', 'quality'),
(8, 3, 5, 'Content migration was handled perfectly. No data loss and minimal downtime.', 'overall'),
(9, 3, 4, 'Good SEO work. Our search rankings have improved significantly.', 'overall');
