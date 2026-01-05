import React, { useEffect, useState, type JSX } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { fetchProjects } from '../../store/slices/projectSlice';
import { fetchTasks } from '../../store/slices/taskSlice';
import { 
  FaProjectDiagram, 
  FaChartLine, 
  FaClock, 
  FaCheckCircle,
  FaFileAlt,
  FaBell,
  FaDownload,
  FaPlus,
  FaTimes,
  FaSave,
  FaEye,
  FaStar,
  FaRegStar,
  FaPaperclip,
  FaFilePdf,
  FaTrash,
  FaUpload
} from 'react-icons/fa';
import styles from './ClientProjectPage.module.css';

// Import ratings functionality
import {
  fetchProjectRatings,
  addProjectRating,
  selectProjectRatings,
  selectProjectAverageRating,
  selectUserProjectRating,
  type ProjectRating
} from '../../store/slices/ratingsSlice';

import { API_URL } from '../../../api.ts';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  deadline: string;
  client_company_id: number;
  admin_id: number;
  client_company_name?: string;
  admin_name?: string;
  created_at: string;
  updated_at: string;
  project_document?: string;  // base64 string
  document_name?: string;
  document_type?: string;
  document_size?: number;
  uploaded_at?: string;
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
  project_name?: string;
  assigned_name?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectRequestData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string;
  budget_range?: string;
  additional_notes?: string;
}

// Helper function to format file size
const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ClientProjectPage: React.FC = () => {
  const { projects, loading } = useSelector((state: RootState) => state.projects);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const dispatch = useDispatch();
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<Project | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Project | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<{ project: Project; file: File | null } | null>(null);

  useEffect(() => {
    dispatch(fetchProjects() as any);
    dispatch(fetchTasks() as any);
  }, [dispatch]);

  // Fetch ratings for all projects when component mounts
  useEffect(() => {
    if (projects.length > 0 && user?.id) {
      projects.forEach(project => {
        dispatch(fetchProjectRatings(project.id) as any);
      });
    }
  }, [dispatch, projects, user?.id]);

  const getProjectStats = (projectId: number) => {
    const projectTasks = tasks.filter(task => (task as any).project_id === projectId);
    return {
      total: projectTasks.length,
      completed: projectTasks.filter(task => task.status === 'completed').length,
      inProgress: projectTasks.filter(task => task.status === 'in_progress').length,
      blocked: projectTasks.filter(task => task.status === 'blocked').length,
      progress: projectTasks.length > 0 
        ? Math.round((projectTasks.filter(task => task.status === 'completed').length / projectTasks.length) * 100)
        : 0
    };
  };

  // Project Request Functions
  const handleOpenRequestModal = () => {
    setShowRequestModal(true);
  };

  const handleSubmitProjectRequest = async (requestData: ProjectRequestData) => {
    try {
      console.log('Submitting project request:', requestData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Your project request has been submitted! We will review it and get back to you soon.');
      setShowRequestModal(false);
    } catch (error) {
      console.error('Error submitting project request:', error);
      alert('There was an error submitting your project request. Please try again.');
    }
  };

  // Project Details Functions
  const handleViewProjectDetails = (project: Project) => {
    setProjectDetails(project);
  };

  // Rating Functions
  const handleOpenRatingModal = (project: Project) => {
    setShowRatingModal(project);
  };

  const handleSubmitRating = async (projectId: number, rating: number, comment: string, wouldRecommend: boolean) => {
    try {
      await dispatch(addProjectRating({
        projectId,
        ratingData: {
          rating,
          comment,
          would_recommend: wouldRecommend
        }
      }) as any);
      
      alert('Thank you for your rating!');
      setShowRatingModal(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('There was an error submitting your rating. Please try again.');
    }
  };

  // Document Functions
  const handleViewDocument = (project: Project) => {
    if (!project.project_document) {
      alert('No document available for this project');
      return;
    }
    setViewingDocument(project);
  };

  const handleDownloadDocument = async (project: Project) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/projects/${project.id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = project.document_name || `project-${project.id}-document.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('Document downloaded successfully');
  } catch (error) {
    console.error('Error downloading document:', error);
    alert('Failed to download document');
  }
};

  // Handle document upload (for client feedback or additional documents)
  const handleUploadDocument = (project: Project) => {
    setShowUploadModal({ project, file: null });
  };

  const handleFileUploadSubmit = async () => {
    if (!showUploadModal?.file) {
      alert('Please select a file to upload');
      return;
    }

    const file = showUploadModal.file;
    
    // Validate file
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      alert('Only PDF and image files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // Here you would typically send to your API
        console.log('Uploading document for project:', showUploadModal.project.id, {
          name: file.name,
          type: file.type,
          size: file.size,
          base64Data: base64Data.substring(0, 100) + '...' // Log first 100 chars
        });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert('Document uploaded successfully!');
        setShowUploadModal(null);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document');
    }
  };

  const handleDownloadReport = (projectId: number) => {
    console.log('Downloading report for project:', projectId);
    alert('Project report download started...');
  };

  const handleRequestUpdate = (projectId: number) => {
    console.log('Requesting update for project:', projectId);
    alert('Update request has been sent to the project team.');
  };

  if (loading) return <div className={styles.loading}>Loading Projects...</div>;

  return (
    <div className={styles.clientProjectPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>My Projects</h1>
          <p>Track progress and communicate with the development team</p>
        </div>
      </div>

      {/* Client Statistics */}
      <div className={styles.projectStatsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaProjectDiagram />
          </div>
          <div className={styles.statInfo}>
            <h3>{projects.length}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.progress}`}>
            <FaChartLine />
          </div>
          <div className={styles.statInfo}>
            <h3>
              {projects.length > 0 
                ? Math.round(projects.reduce((acc, project) => acc + getProjectStats(project.id).progress, 0) / projects.length)
                : 0
              }%
            </h3>
            <p>Average Progress</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.completed}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>
              {tasks.filter(task => task.status === 'completed').length}
            </h3>
            <p>Completed Tasks</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.pending}`}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <h3>
              {tasks.filter(task => task.status !== 'completed').length}
            </h3>
            <p>Pending Tasks</p>
          </div>
        </div>
      </div>

      {/* Projects Overview */}
      <div className={styles.projectsOverview}>
        <h2>Project Overview</h2>
        <div className={styles.projectsGrid}>
          {projects.map(project => (
            <ProjectCard 
              key={project.id}
              project={project}
              tasks={tasks}
              onViewDetails={handleViewProjectDetails}
              onRequestUpdate={handleRequestUpdate}
              onRateProject={handleOpenRatingModal}
              onViewDocument={handleViewDocument}
              onDownloadDocument={handleDownloadDocument}
              onUploadDocument={handleUploadDocument}
            />
          ))}
        </div>

        {projects.length === 0 && (
          <div className={styles.noProjects}>
            <FaProjectDiagram className={styles.noProjectsIcon} />
            <h3>No Projects Yet</h3>
            <p>You don't have any active projects. Start by requesting a new project.</p>
            <button 
              className={styles.btnPrimary}
              onClick={handleOpenRequestModal}
            >
              <FaPlus /> Request Your First Project
            </button>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {projectDetails && (
        <ProjectDetailsModal
          project={projectDetails}
          tasks={tasks.filter(task => (task as any).project_id === projectDetails.id)}
          onClose={() => setProjectDetails(null)}
          onDownloadReport={() => handleDownloadReport(projectDetails.id)}
          onRequestUpdate={() => handleRequestUpdate(projectDetails.id)}
          onRateProject={() => handleOpenRatingModal(projectDetails)}
          onViewDocument={() => handleViewDocument(projectDetails)}
          onDownloadDocument={() => handleDownloadDocument(projectDetails)}
          onUploadDocument={() => handleUploadDocument(projectDetails)}
        />
      )}

      {/* Project Request Modal */}
      {showRequestModal && (
        <ProjectRequestModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleSubmitProjectRequest}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <ProjectRatingModal
          project={showRatingModal}
          onClose={() => setShowRatingModal(null)}
          onSubmit={handleSubmitRating}
        />
      )}

      {/* Document View Modal */}
      {viewingDocument && (
        <DocumentViewModal
          project={viewingDocument}
          onClose={() => setViewingDocument(null)}
          onDownload={() => handleDownloadDocument(viewingDocument)}
        />
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          project={showUploadModal.project}
          onClose={() => setShowUploadModal(null)}
          onSubmit={handleFileUploadSubmit}
        />
      )}
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onViewDetails: (project: Project) => void;
  onRequestUpdate: (projectId: number) => void;
  onRateProject: (project: Project) => void;
  onViewDocument: (project: Project) => void;
  onDownloadDocument: (project: Project) => void;
  onUploadDocument: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  tasks,
  onViewDetails,
  onRequestUpdate,
  onRateProject,
  onViewDocument,
  onDownloadDocument,
  onUploadDocument
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const projectRatings = useSelector((state: RootState) => 
    selectProjectRatings(state, project.id)
  );
  const averageRating = useSelector((state: RootState) => 
    selectProjectAverageRating(state, project.id)
  );
  const userRating = useSelector((state: RootState) => 
    selectUserProjectRating(state, project.id, user?.id || 0)
  );

  const stats = {
    total: tasks.filter(task => (task as any).project_id === project.id).length,
    completed: tasks.filter(task => 
      (task as any).project_id === project.id && task.status === 'completed'
    ).length,
    inProgress: tasks.filter(task => 
      (task as any).project_id === project.id && task.status === 'in_progress'
    ).length,
    blocked: tasks.filter(task => 
      (task as any).project_id === project.id && task.status === 'blocked'
    ).length,
    progress: 0
  };

  stats.progress = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const recentDeliverables = tasks
    .filter(task => 
      (task as any).project_id === project.id && 
      task.status === 'completed'
    )
    .slice(0, 2);

  // Fetch ratings when component mounts
  useEffect(() => {
    dispatch(fetchProjectRatings(project.id) as any);
  }, [dispatch, project.id]);

  return (
    <div className={styles.projectCard}>
      <div className={styles.projectHeader}>
        <h3>{project.name}</h3>
        <div className={styles.headerRight}>
          <span className={`${styles.statusBadge} ${styles[project.status] || styles.inactive}`}>
            {project.status}
          </span>
          {/* Average Rating Display */}
          {averageRating > 0 && (
            <div className={styles.averageRating}>
              <FaStar className={styles.starIcon} />
              <span>{averageRating.toFixed(1)}</span>
              <span className={styles.ratingCount}>({projectRatings.length})</span>
            </div>
          )}
        </div>
      </div>

      <p className={styles.projectDescription}>{project.description}</p>

      {/* Document Preview */}
      {project.project_document && (
        <div className={styles.documentPreview}>
          <div className={styles.documentInfo}>
            <FaPaperclip className={styles.documentIcon} />
            <div className={styles.documentDetails}>
              <span className={styles.documentName}>
                {project.document_name || `Project Document`}
              </span>
              <span className={styles.documentSize}>
                {project.document_size ? `(${formatFileSize(project.document_size)})` : ''}
              </span>
            </div>
          </div>
          <div className={styles.documentActions}>
            <button 
              className={styles.btnIcon}
              onClick={() => onViewDocument(project)}
              title="View Document"
            >
              <FaEye />
            </button>
            <button 
              className={styles.btnIcon}
              onClick={() => onDownloadDocument(project)}
              title="Download Document"
            >
              <FaDownload />
            </button>
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>Overall Progress</span>
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

      {/* Project Metrics */}
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
          <span className={styles.metricValue}>{stats.inProgress}</span>
          <span className={styles.metricLabel}>In Progress</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{Math.round(stats.progress)}%</span>
          <span className={styles.metricLabel}>Progress</span>
        </div>
      </div>

      {/* Recent Deliverables */}
      {recentDeliverables.length > 0 && (
        <div className={styles.recentDeliverables}>
          <h4>Recent Deliverables</h4>
          {recentDeliverables.map(task => (
            <div key={task.id} className={styles.deliverableItem}>
              <span className={styles.deliverableTitle}>{task.title}</span>
              <span className={styles.deliverableDate}>
                {new Date(task.updated_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Deadline */}
      {project.deadline && (
        <div className={styles.deadlineInfo}>
          <FaClock />
          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
        </div>
      )}

      {/* Client Actions */}
      <div className={styles.projectActions}>
        <button 
          className={styles.btnSecondary}
          onClick={() => onViewDetails(project)}
        >
          <FaEye /> Details
        </button>
        <button 
          className={styles.btnWarning}
          onClick={() => onRequestUpdate(project.id)}
        >
          <FaBell /> Request Update
        </button>
        <button 
          className={styles.btnSuccess}
          onClick={() => onRateProject(project)}
        >
          <FaStar /> {userRating ? 'Update Rating' : 'Rate Project'}
        </button>
        {project.project_document && (
          <button 
            className={styles.btnInfo}
            onClick={() => onUploadDocument(project)}
          >
            <FaUpload /> Upload Feedback
          </button>
        )}
      </div>

      {/* User's Current Rating Display */}
      {userRating && (
        <div className={styles.userRating}>
          <span>Your rating: </span>
          <div className={styles.userRatingStars}>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} className={star <= userRating.rating ? styles.starFilled : styles.starEmpty}>
                {star <= userRating.rating ? <FaStar /> : <FaRegStar />}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Project Details Modal Component
interface ProjectDetailsModalProps {
  project: Project;
  tasks: Task[];
  onClose: () => void;
  onDownloadReport: () => void;
  onRequestUpdate: () => void;
  onRateProject: () => void;
  onViewDocument: () => void;
  onDownloadDocument: () => void;
  onUploadDocument: () => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  tasks,
  onClose,
  onDownloadReport,
  onRequestUpdate,
  onRateProject,
  onViewDocument,
  onDownloadDocument,
  onUploadDocument
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const projectRatings = useSelector((state: RootState) => 
    selectProjectRatings(state, project.id)
  );
  const averageRating = useSelector((state: RootState) => 
    selectProjectAverageRating(state, project.id)
  );
  const userRating = useSelector((state: RootState) => 
    selectUserProjectRating(state, project.id, user?.id || 0)
  );

  const stats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'completed').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    blocked: tasks.filter(task => task.status === 'blocked').length,
    progress: tasks.length > 0 
      ? Math.round((tasks.filter(task => task.status === 'completed').length / tasks.length) * 100)
      : 0
  };

  const recentTasks = tasks.slice(0, 5);

  // Fetch ratings when modal opens
  useEffect(() => {
    dispatch(fetchProjectRatings(project.id) as any);
  }, [dispatch, project.id]);

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.large}`}>
        <div className={styles.modalHeader}>
          <h2>Project Details: {project.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Document Section */}
          {project.project_document && (
            <div className={styles.documentSection}>
              <h3>Project Document</h3>
              <div className={styles.documentCard}>
                <div className={styles.documentHeader}>
                  <FaFilePdf className={styles.documentIconLarge} />
                  <div className={styles.documentInfo}>
                    <span className={styles.documentName}>
                      {project.document_name || `Project ${project.id} Document`}
                    </span>
                    <span className={styles.documentMeta}>
                      {project.document_type || 'PDF'} • {formatFileSize(project.document_size)}
                    </span>
                    <span className={styles.documentDate}>
                      {project.uploaded_at 
                        ? `Uploaded: ${new Date(project.uploaded_at).toLocaleDateString()}` 
                        : 'No upload date available'}
                    </span>
                  </div>
                </div>
                <div className={styles.documentActions}>
                  <button 
                    className={styles.btnSecondary}
                    onClick={onViewDocument}
                  >
                    <FaEye /> View Document
                  </button>
                  <button 
                    className={styles.btnPrimary}
                    onClick={onDownloadDocument}
                  >
                    <FaDownload /> Download
                  </button>
                  <button 
                    className={styles.btnInfo}
                    onClick={onUploadDocument}
                  >
                    <FaUpload /> Upload Feedback
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rating Summary */}
          <div className={styles.ratingSummary}>
            <div className={styles.ratingOverview}>
              <h3>Project Rating</h3>
              {averageRating > 0 ? (
                <div className={styles.ratingDisplay}>
                  <div className={styles.averageRating}>
                    <span className={styles.ratingValue}>{averageRating.toFixed(1)}</span>
                    <div className={styles.stars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={star <= Math.round(averageRating) ? styles.starFilled : styles.starEmpty}>
                          {star <= Math.round(averageRating) ? <FaStar /> : <FaRegStar />}
                        </span>
                      ))}
                    </div>
                    <span className={styles.ratingCount}>({projectRatings.length} ratings)</span>
                  </div>
                </div>
              ) : (
                <p>No ratings yet</p>
              )}
            </div>
          </div>

          <div className={styles.projectInfo}>
            <div className={styles.infoSection}>
              <h3>Description</h3>
              <p>{project.description}</p>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>Status:</strong>
                <span className={`${styles.statusBadge} ${styles[project.status] || styles.inactive}`}>
                  {project.status}
                </span>
              </div>
              <div className={styles.infoItem}>
                <strong>Project Manager:</strong>
                <span>{project.admin_name || 'Not assigned'}</span>
              </div>
              {project.deadline && (
                <div className={styles.infoItem}>
                  <strong>Deadline:</strong>
                  <span>{new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <strong>Created:</strong>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className={styles.statsSection}>
            <h3>Progress Overview</h3>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <div className={styles.statNumber}>{stats.progress}%</div>
                <div className={styles.statLabel}>Overall Progress</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>{stats.total}</div>
                <div className={styles.statLabel}>Total Tasks</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>{stats.completed}</div>
                <div className={styles.statLabel}>Completed</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>{stats.blocked}</div>
                <div className={styles.statLabel}>Blocked</div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className={styles.tasksSection}>
            <h3>Recent Tasks</h3>
            {recentTasks.length > 0 ? (
              <div className={styles.tasksList}>
                {recentTasks.map(task => (
                  <div key={task.id} className={styles.taskItem}>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <span className={`${styles.taskStatus} ${styles[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={styles.taskProgress}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ width: `${task.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span>{task.progress_percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No tasks found for this project.</p>
            )}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
          <button className={styles.btnWarning} onClick={onRequestUpdate}>
            <FaBell /> Request Update
          </button>
          <button className={styles.btnSuccess} onClick={onRateProject}>
            <FaStar /> {userRating ? 'Update Rating' : 'Rate Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Document View Modal Component
interface DocumentViewModalProps {
  project: Project;
  onClose: () => void;
  onDownload: () => void;
}

const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  project,
  onClose,
  onDownload
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDocumentUrl = () => {
    if (!project.project_document) {
      setError('No document data available');
      return '';
    }
    
    try {
      // Clean base64 data - remove data URL prefix if present
      const base64Data = project.project_document.includes('base64,') 
        ? project.project_document.split('base64,')[1] 
        : project.project_document;

      // Create a blob URL from the base64 data
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: project.document_type || 'application/pdf' });
      
      return URL.createObjectURL(blob);
    } catch (err) {
      setError('Error loading document: ' + (err as Error).message);
      return '';
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const documentUrl = getDocumentUrl();

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.fullscreen}`}>
        <div className={styles.modalHeader}>
          <div className={styles.documentTitle}>
            <FaFilePdf />
            <h2>{project.document_name || `Project ${project.id} Document`}</h2>
          </div>
          <div className={styles.documentActions}>
            <button className={styles.btnPrimary} onClick={onDownload}>
              <FaDownload /> Download
            </button>
            <button className={styles.closeButton} onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className={styles.documentViewer}>
          {loading && !error && (
            <div className={styles.documentLoading}>
              <div className={styles.spinner}></div>
              <p>Loading document...</p>
            </div>
          )}
          
          {error ? (
            <div className={styles.documentError}>
              <FaFileAlt className={styles.errorIcon} />
              <h3>Error Loading Document</h3>
              <p>{error}</p>
              <button className={styles.btnPrimary} onClick={onDownload}>
                <FaDownload /> Download Instead
              </button>
            </div>
          ) : project.document_type?.includes('pdf') ? (
            <>
              {loading && (
                <div className={styles.documentLoading}>
                  <div className={styles.spinner}></div>
                  <p>Loading document...</p>
                </div>
              )}
              <iframe
                src={documentUrl}
                className={styles.documentFrame}
                onLoad={handleIframeLoad}
                title={project.document_name || 'Project Document'}
              />
            </>
          ) : (
            <div className={styles.documentUnsupported}>
              <FaFileAlt className={styles.unsupportedIcon} />
              <h3>Document Preview Not Available</h3>
              <p>Preview is only available for PDF files. Please download the document to view it.</p>
              <button className={styles.btnPrimary} onClick={onDownload}>
                <FaDownload /> Download to View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Upload Document Modal Component
interface UploadDocumentModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: () => void;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  project,
  onClose,
  onSubmit
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file
      if (!selectedFile.type.includes('pdf') && !selectedFile.type.includes('image')) {
        alert('Only PDF and image files are allowed');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Upload Feedback Document</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalContent}>
          <p>Upload feedback or additional documents for: <strong>{project.name}</strong></p>
          
          <form className={styles.uploadForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Select File (PDF or Image, max 10MB)</label>
              <div className={styles.fileUploadArea}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  id="feedback-file-upload"
                />
                <label htmlFor="feedback-file-upload" className={styles.fileUploadLabel}>
                  <FaUpload className={styles.uploadIcon} />
                  <span>Choose file or drag and drop</span>
                  <p className={styles.fileHint}>PDF, JPG, PNG, GIF up to 10MB</p>
                </label>
              </div>
              
              {file && (
                <div className={styles.filePreview}>
                  <FaPaperclip className={styles.fileIcon} />
                  <div className={styles.fileDetails}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={() => setFile(null)}
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.btnSecondary} 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload /> Upload Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Project Request Modal Component
interface ProjectRequestModalProps {
  onClose: () => void;
  onSubmit: (requestData: ProjectRequestData) => void;
}

const ProjectRequestModal: React.FC<ProjectRequestModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ProjectRequestData>({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    budget_range: '',
    additional_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit(formData);
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
          <h2>Request New Project</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.requestForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Project Title *</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter project title"
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description *</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Describe your project requirements..."
              rows={4}
              disabled={submitting}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                required
                disabled={submitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
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
          </div>

          <div className={styles.formGroup}>
            <label>Budget Range (Optional)</label>
            <input 
              type="text" 
              value={formData.budget_range}
              onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
              placeholder="e.g., $5,000 - $10,000"
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Additional Notes (Optional)</label>
            <textarea 
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
              placeholder="Any additional information..."
              rows={3}
              disabled={submitting}
            />
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
                  Submitting...
                </>
              ) : (
                <>
                  <FaSave /> Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Project Rating Modal Component
interface ProjectRatingModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: (projectId: number, rating: number, comment: string, wouldRecommend: boolean) => void;
}

const ProjectRatingModal: React.FC<ProjectRatingModalProps> = ({
  project,
  onClose,
  onSubmit
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(project.id, rating, comment, wouldRecommend);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Rate Project: {project.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.ratingForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Project Rating *</label>
            <div className={styles.ratingInput}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.starButton} ${star <= rating ? styles.active : ''}`}
                  onClick={() => setRating(star)}
                  disabled={submitting}
                >
                  {star <= rating ? <FaStar /> : <FaRegStar />}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="comment">Comment (Optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback about this project..."
              rows={4}
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
                disabled={submitting}
              />
              <span>I would recommend this project/team</span>
            </label>
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
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FaSave /> Submit Rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
  
export default ClientProjectPage;