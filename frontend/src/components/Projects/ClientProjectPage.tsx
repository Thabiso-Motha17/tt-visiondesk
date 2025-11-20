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
  FaRegStar
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

const ClientProjectPage: React.FC = () => {
  const { projects, loading } = useSelector((state: RootState) => state.projects);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const dispatch = useDispatch();
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<Project | null>(null);

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
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  tasks,
  onViewDetails,
  onRequestUpdate,
  onRateProject
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
          <span className={`${styles.statusBadge} ${styles[project.status]}`}>
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
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  tasks,
  onClose,
  onDownloadReport,
  onRequestUpdate,
  onRateProject
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
                <span className={`${styles.statusBadge} ${styles[project.status]}`}>
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

// Project Request Modal Component (unchanged)
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
              placeholder="Enter project title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description *</label>
            <textarea 
              placeholder="Describe your project requirements, goals, and objectives..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={submitting}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                disabled={submitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Desired Deadline</label>
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
            <select
              value={formData.budget_range}
              onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
              disabled={submitting}
            >
              <option value="">Select budget range</option>
              <option value="under-5k">Under $5,000</option>
              <option value="5k-15k">$5,000 - $15,000</option>
              <option value="15k-50k">$15,000 - $50,000</option>
              <option value="over-50k">Over $50,000</option>
              <option value="custom">Custom Quote Needed</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Additional Notes (Optional)</label>
            <textarea 
              placeholder="Any additional information, special requirements, or notes..."
              rows={3}
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
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

// New Project Rating Modal Component
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
  const { user } = useSelector((state: RootState) => state.auth);
  const userRating = useSelector((state: RootState) => 
    selectUserProjectRating(state, project.id, user?.id || 0)
  );

  const [rating, setRating] = useState(userRating?.rating || 0);
  const [comment, setComment] = useState(userRating?.comment || '');
  const [wouldRecommend, setWouldRecommend] = useState<boolean>(userRating?.would_recommend || true);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

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
          {/* Star Rating */}
          <div className={styles.formGroup}>
            <label>Your Rating *</label>
            <div className={styles.starRating}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${star <= (hoverRating || rating) ? styles.active : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={submitting}
                >
                  <FaStar />
                </button>
              ))}
            </div>
            <div className={styles.ratingLabels}>
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Comment */}
          <div className={styles.formGroup}>
            <label>Comments (Optional)</label>
            <textarea
              placeholder="Share your experience with this project..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Recommendation */}
          <div className={styles.formGroup}>
            <label>Would you recommend this team?</label>
            <div className={styles.recommendOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="recommend"
                  checked={wouldRecommend === true}
                  onChange={() => setWouldRecommend(true)}
                  disabled={submitting}
                />
                <span>Yes, definitely</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="recommend"
                  checked={wouldRecommend === false}
                  onChange={() => setWouldRecommend(false)}
                  disabled={submitting}
                />
                <span>No, probably not</span>
              </label>
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
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FaSave /> {userRating ? 'Update Rating' : 'Submit Rating'}
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