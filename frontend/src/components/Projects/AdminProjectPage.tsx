import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store.ts';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUsers, 
  FaChartLine, 
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaDownload,
  FaSave
} from 'react-icons/fa';
import styles from './AdminProjectPage.module.css';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  clearError as clearProjectError
} from '../../store/slices/projectSlice';
import {
  fetchTasks,
  clearError as clearTaskError
} from '../../store/slices/taskSlice';
import {
  fetchCompanies,
  clearError as clearCompanyError
} from '../../store/slices/CompanySlice';

interface Project {
  id: number;
  name: string;
  description: string;
  client_company_id: number;
  admin_id: number;
  status: string;
  deadline: string;
  client_company_name?: string;
  admin_name?: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number;
  assigned_to: number;
  status: string;
  priority: string;
  progress_percentage: number;
  deadline: string;
  created_by: number;
}

interface CreateProjectData {
  name: string;
  description: string;
  client_company_id: number;
  deadline: string;
  status?: string;
}

const AdminProjectPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { projects, loading: projectsLoading, error: projectsError } = useSelector((state: RootState) => state.projects);
  const { tasks, loading: tasksLoading, error: tasksError } = useSelector((state: RootState) => state.tasks);
  const { companies, loading: companiesLoading, error: companiesError } = useSelector((state: RootState) => state.companies);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Fetch projects, tasks, and companies from Redux
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasks());
    dispatch(fetchCompanies());
  }, [dispatch]);

  // Create project using Redux
  const handleCreateProject = async (projectData: CreateProjectData) => {
    try {
      const result = await dispatch(createProject({
        ...projectData,
        admin_id: user?.id,
        status: 'active'
      })).unwrap();
      
      setShowCreateModal(false);
      alert('Project created successfully!');
    } catch (err) {
      console.error('Error creating project:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to create project'}`);
    }
  };

  // Update project using Redux
  const handleUpdateProject = async (projectData: CreateProjectData) => {
    if (!editingProject) return;

    try {
      const result = await dispatch(updateProject({
        projectId: editingProject.id,
        projectData: {
          name: projectData.name,
          description: projectData.description,
          client_company_id: projectData.client_company_id,
          deadline: projectData.deadline,
          status: projectData.status || 'active'
        }
      })).unwrap();
      
      setEditingProject(null);
      alert('Project updated successfully!');
    } catch (err) {
      console.error('Error updating project:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to update project'}`);
    }
  };

  // Delete project using Redux
  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks and milestones. This action cannot be undone.')) {
      return;
    }

    try {
      await dispatch(deleteProject(projectId)).unwrap();
      alert('Project deleted successfully!');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete project'}`);
    }
  };

  const getProjectStats = (projectId: number) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId);
    const completedTasks = projectTasks.filter(task => 
      task.status === 'completed' || task.progress_percentage === 100
    );
    
    return {
      total: projectTasks.length,
      completed: completedTasks.length,
      inProgress: projectTasks.filter(task => 
        task.status === 'in_progress' && task.progress_percentage < 100
      ).length,
      blocked: projectTasks.filter(task => task.status === 'blocked').length,
      progress: projectTasks.length > 0 
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0
    };
  };

  const getOverdueProjects = () => {
    return projects.filter(project => {
      const stats = getProjectStats(project.id);
      return stats.progress < 100 && 
             project.deadline && 
             new Date(project.deadline) < new Date();
    });
  };

  // Get company name by ID
  const getCompanyName = (companyId: number) => {
    const company = companies.find(company => company.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearProjectError());
      dispatch(clearTaskError());
      dispatch(clearCompanyError());
    };
  }, [dispatch]);

  // Combined loading state
  const loading = projectsLoading || tasksLoading || companiesLoading;

  if (loading) return <div className={styles.loading}>Loading Projects...</div>;

  return (
    <div className={styles.adminProjectPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Project Management</h1>
          <p>Manage all projects, track progress, and oversee project health</p>
        </div>
        <button 
          className={styles.btnPrimary}
          onClick={() => setShowCreateModal(true)}
          disabled={!['manager', 'admin'].includes(user?.role || '')}
        >
          <FaPlus /> Create New Project
        </button>
      </div>

      {/* Project Statistics */}
      <div className={styles.projectStatsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaChartLine />
          </div>
          <div className={styles.statInfo}>
            <h3>{projects.length}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.active}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>{projects.filter(p => p.status === 'active').length}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <h3>{getOverdueProjects().length}</h3>
            <p>Behind Schedule</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.danger}`}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statInfo}>
            <h3>{tasks.filter(task => task.status === 'blocked').length}</h3>
            <p>Blocked Tasks</p>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className={styles.projectsTableContainer}>
        <div className={styles.tableHeader}>
          <h2>All Projects ({projects.length})</h2>
          <div className={styles.tableActions}>
            <button className={styles.btnSecondary}>
              <FaDownload /> Export
            </button>
          </div>
        </div>

        <div className={styles.projectsGrid}>
          {projects.map(project => {
            const stats = getProjectStats(project.id);
            const isOverdue = project.deadline && 
                             new Date(project.deadline) < new Date() && 
                             stats.progress < 100;
            
            return (
              <div key={project.id} className={styles.projectCard}>
                <div className={styles.projectHeader}>
                  <div className={styles.projectTitle}>
                    <h3>{project.name}</h3>
                    <div className={styles.projectMeta}>
                      <span className={`${styles.statusBadge} ${styles[project.status]}`}>
                        {project.status || 'inactive'}
                      </span>
                      {isOverdue && (
                        <span className={styles.overdueBadge}>Overdue</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className={styles.projectDescription}>{project.description}</p>
                
                <p className={styles.clientCompany}>
                  <FaUsers /> Client: {project.client_company_name || getCompanyName(project.client_company_id)}
                </p>

                {/* Progress Section */}
                <div className={styles.progressSection}>
                  <div className={styles.progressInfo}>
                    <span>Progress</span>
                    <span>{stats.progress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={`${styles.progressFill} ${
                        stats.progress < 50 ? styles.low : 
                        stats.progress < 80 ? styles.medium : styles.high
                      }`}
                      style={{ width: `${stats.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Stats */}
                <div className={styles.projectMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{stats.total}</span>
                    <span className={styles.metricLabel}>Total Tasks</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{stats.completed}</span>
                    <span className={styles.metricLabel}>Completed</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{stats.blocked}</span>
                    <span className={styles.metricLabel}>Blocked</span>
                  </div>
                </div>

                {/* Deadline */}
                {project.deadline && (
                  <div className={`${styles.deadlineInfo} ${isOverdue ? styles.overdue : ''}`}>
                    <FaClock />
                    <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                    {isOverdue && (
                      <span className={styles.overdueText}>Overdue</span>
                    )}
                  </div>
                )}

                {/* Created Date */}
                <div className={styles.createdInfo}>
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                </div>

                {/* Admin Actions */}
                <div className={styles.projectActions}>
                  <button 
                    className={styles.btnSecondary}
                    onClick={() => setEditingProject(project)}
                    disabled={!['manager', 'admin'].includes(user?.role || '')}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className={styles.btnDanger}
                    onClick={() => handleDeleteProject(project.id)}
                    disabled={!['manager', 'admin'].includes(user?.role || '')}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {projects.length === 0 && !loading && (
          <div className={styles.noProjects}>
            <p>No projects found. Create your first project to get started.</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          companies={companies}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          companies={companies}
          onClose={() => setEditingProject(null)}
          onSubmit={handleUpdateProject}
        />
      )}
    </div>
  );
};

// Create Project Modal Component
interface CreateProjectModalProps {
  companies: any[];
  onClose: () => void;
  onSubmit: (projectData: CreateProjectData) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ companies, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_company_id: '',
    deadline: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        client_company_id: parseInt(formData.client_company_id)
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Create New Project</h2>
        <form className={styles.projectForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Project Name *</label>
            <input 
              type="text" 
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description *</label>
            <textarea 
              placeholder="Enter project description" 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={submitting}
            ></textarea>
          </div>
          <div className={styles.formGroup}>
            <label>Client Company *</label>
            <select
              value={formData.client_company_id}
              onChange={(e) => setFormData({ ...formData, client_company_id: e.target.value })}
              required
              disabled={submitting}
            >
              <option value="">Select client company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Deadline</label>
            <input 
              type="date" 
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={submitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Creating...
                </>
              ) : (
                <>
                  <FaSave /> Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Project Modal Component
interface EditProjectModalProps {
  project: Project;
  companies: any[];
  onClose: () => void;
  onSubmit: (projectData: CreateProjectData) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, companies, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    client_company_id: project.client_company_id.toString(),
    deadline: project.deadline || '',
    status: project.status
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        client_company_id: parseInt(formData.client_company_id)
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Edit Project</h2>
        <form className={styles.projectForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Project Name *</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description *</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={submitting}
            ></textarea>
          </div>
          <div className={styles.formGroup}>
            <label>Client Company *</label>
            <select
              value={formData.client_company_id}
              onChange={(e) => setFormData({ ...formData, client_company_id: e.target.value })}
              required
              disabled={submitting}
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Deadline</label>
            <input 
              type="date" 
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={submitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave /> Update Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProjectPage;