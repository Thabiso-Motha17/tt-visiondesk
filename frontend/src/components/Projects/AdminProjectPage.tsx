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
  FaSave,
  FaPaperclip,
  FaTimes,
  FaSearch,
  FaFilter,
  FaSort
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
  project_file?: File | null;
}

const AdminProjectPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { projects, loading: projectsLoading, error: projectsError } = useSelector((state: RootState) => state.projects);
  const { tasks, loading: tasksLoading, error: tasksError } = useSelector((state: RootState) => state.tasks);
  const { companies, loading: companiesLoading, error: companiesError } = useSelector((state: RootState) => state.companies);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Fetch projects, tasks, and companies from Redux
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasks());
    dispatch(fetchCompanies());
  }, [dispatch]);

  // Create project using Redux
  const handleCreateProject = async (projectData: CreateProjectData) => {
  try {
    // Prepare document data if file exists
    let documentData = {};
    if (projectData.project_file) {
      const base64String = await convertFileToBase64(projectData.project_file);
      
      documentData = {
        project_document: base64String,
        document_name: projectData.project_file.name,
        document_type: projectData.project_file.type,
        document_size: projectData.project_file.size
      };
    }

    const result = await dispatch(createProject({
      ...projectData,
      ...documentData,
      admin_id: user?.id || 0
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

  const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

  // File upload handler function
  const handleFileUpload = (file: File, setFormData: React.Dispatch<React.SetStateAction<any>>) => {
    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed!');
      return false;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return false;
    }

    setFormData((prev: any) => ({
      ...prev,
      project_file: file
    }));
    
    return true;
  };

  // Remove file handler function
  const handleRemoveFile = (setFormData: React.Dispatch<React.SetStateAction<any>>) => {
    setFormData((prev: any) => ({
      ...prev,
      project_file: null
    }));
  };

  // Get project statistics
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

  // Get overdue projects
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

  // Filter and sort projects
  const getFilteredProjects = () => {
    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client_company_name && project.client_company_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'progress':
          return getProjectStats(b.id).progress - getProjectStats(a.id).progress;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
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

  // Get unique statuses for filter
  const statuses = ['all', ...new Set(projects.map(p => p.status))];

  if (loading) return <div className={styles.loading}>Loading Projects...</div>;

  return (
    <div className={styles.adminProjectPage}>
      {/* Header Section */}
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

      {/* Projects Table Section */}
      <div className={styles.projectsTableContainer}>
        <div className={styles.tableHeader}>
          <h2>All Projects ({getFilteredProjects().length})</h2>
          <div className={styles.tableControls}>
            {/* Search Bar */}
            <div className={styles.searchBar}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Filters */}
            <div className={styles.filterGroup}>
              <div className={styles.filter}>
                <FaFilter className={styles.filterIcon} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filter}>
                <FaSort className={styles.filterIcon} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="deadline">Deadline</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
            </div>

            {/* Export Button */}
            <div className={styles.tableActions}>
              <button className={styles.btnSecondary}>
                <FaDownload /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className={styles.projectsGrid}>
          {getFilteredProjects().map(project => {
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
                      <span className={`${styles.statusBadge} ${styles[project.status] || styles.inactive}`}>
                        {project.status || 'inactive'}
                      </span>
                      {isOverdue && (
                        <span className={styles.overdueBadge}>Overdue</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className={styles.projectDescription}>{project.description}</p>
                
                <div className={styles.projectClient}>
                  <FaUsers className={styles.clientIcon} />
                  <span>Client: {project.client_company_name || getCompanyName(project.client_company_id)}</span>
                </div>

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
                    <FaClock className={styles.deadlineIcon} />
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

        {getFilteredProjects().length === 0 && !loading && (
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
          handleFileUpload={handleFileUpload}
          handleRemoveFile={handleRemoveFile}
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
  handleFileUpload: (file: File, setFormData: React.Dispatch<React.SetStateAction<any>>) => boolean;
  handleRemoveFile: (setFormData: React.Dispatch<React.SetStateAction<any>>) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  companies, 
  onClose, 
  onSubmit, 
  handleFileUpload, 
  handleRemoveFile 
}) => {
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    client_company_id: 0,
    deadline: '',
    status: 'active',
    project_file: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  
  // Validate required fields
  if (!formData.name.trim() || !formData.description.trim() || !formData.client_company_id) {
    alert('Please fill in all required fields');
    setSubmitting(false);
    return;
  }

  try {
    await onSubmit({
      ...formData,
      client_company_id: formData.client_company_id,
      deadline: formData.deadline || new Date().toISOString().split('T')[0],
      // The file should already be in formData.project_file
    });
  } catch (error) {
    console.error('Error submitting form:', error);
  } finally {
    setSubmitting(false);
  }
};

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = handleFileUpload(file, setFormData);
      if (success) {
        console.log('File selected successfully:', file.name);
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const success = handleFileUpload(file, setFormData);
      if (success) {
        console.log('File dropped successfully:', file.name);
      }
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Create New Project</h2>
          <button 
            type="button" 
            className={styles.closeButton}
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        <form className={styles.projectForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.required}>Project Name</label>
            <input 
              type="text" 
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={submitting}
              className={styles.formInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.required}>Description</label>
            <textarea 
              placeholder="Enter project description" 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={submitting}
              className={styles.formTextarea}
            ></textarea>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.required}>Client Company</label>
            <select
              value={formData.client_company_id || ''}
              onChange={(e) => setFormData({ ...formData, client_company_id: parseInt(e.target.value) || 0 })}
              required
              disabled={submitting}
              className={styles.formSelect}
            >
              <option value="">Select client company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Deadline</label>
              <input 
                type="date" 
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                disabled={submitting}
                className={styles.formInput}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Status</label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={submitting}
                className={styles.formSelect}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* File Upload Section */}
          <div className={styles.formGroup}>
            <label>Project Document (PDF only, max 10MB)</label>
            <div className={styles.fileUploadContainer}>
              {!formData.project_file ? (
                <div 
                  className={`${styles.fileUploadArea} ${dragOver ? styles.dragOver : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={submitting}
                    className={styles.fileInput}
                    id="project-file-upload"
                  />
                  <label htmlFor="project-file-upload" className={styles.fileUploadLabel}>
                    <FaPaperclip className={styles.uploadIcon} />
                    <span className={styles.uploadText}>Choose PDF file or drag and drop</span>
                    <p className={styles.fileHint}>Only PDF files are allowed. Max size: 10MB</p>
                  </label>
                </div>
              ) : (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <FaPaperclip className={styles.fileIcon} />
                    <div className={styles.fileDetails}>
                      <span className={styles.fileName}>{formData.project_file.name}</span>
                      <span className={styles.fileSize}>
                        ({(formData.project_file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={() => handleRemoveFile(setFormData)}
                    disabled={submitting}
                    title="Remove file"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
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
    client_company_id: project.client_company_id,
    deadline: project.deadline || '',
    status: project.status || 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        client_company_id: formData.client_company_id
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
        <div className={styles.modalHeader}>
          <h2>Edit Project</h2>
          <button 
            type="button" 
            className={styles.closeButton}
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        <form className={styles.projectForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.required}>Project Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={submitting}
              className={styles.formInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.required}>Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={submitting}
              className={styles.formTextarea}
            ></textarea>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.required}>Client Company</label>
            <select
              value={formData.client_company_id}
              onChange={(e) => setFormData({ ...formData, client_company_id: parseInt(e.target.value) })}
              required
              disabled={submitting}
              className={styles.formSelect}
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Deadline</label>
              <input 
                type="date" 
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                disabled={submitting}
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={submitting}
                className={styles.formSelect}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
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