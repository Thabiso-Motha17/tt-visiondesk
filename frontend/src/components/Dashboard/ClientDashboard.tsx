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
  FaComment,
  FaHistory,
  FaStar,
  FaBell,
  FaTimes,
  FaSave
} from 'react-icons/fa';
import styles from './ClientDashboard.module.css';
import TextType from '../../ui/TextType';

// Import comments and ratings slice actions and selectors
import {
  fetchComments,
  addComment,
  fetchRatings,
  addOrUpdateRating,
  fetchAverageRating,
} from '../../store/slices/commentsRatingsSlice';
import {
  selectCommentsByProject,
  selectRatingsByProject,
  selectAverageRatingByProject,
  selectAddCommentLoading,
  selectAddRatingLoading
} from '../../store/slices/commentsRatingsSelectors';

// Define proper types based on your slices
interface ProjectWithStats {
  id: number;
  name: string;
  description: string;
  status: string;
  deadline: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  client_company_name?: string;
}

interface FeedbackData {
  projectId: number | null;
  content: string;
}

interface RatingData {
  projectId: number | null;
  rating: number;
  comment: string;
}

const ClientDashboard: React.FC = () => {
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Comments and ratings state
  const addCommentLoading = useSelector(selectAddCommentLoading);
  const addRatingLoading = useSelector(selectAddRatingLoading);
  
  const dispatch = useDispatch();

  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProjectForFeedback, setSelectedProjectForFeedback] = useState<number | null>(null);
  const [selectedProjectForRating, setSelectedProjectForRating] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchProjects() as any);
    dispatch(fetchTasks() as any);
  }, [dispatch]);

  // Filter tasks for client's projects with proper typing
  const clientTasks = tasks.filter(task => 
    projects.some(project => project.id === task.project_id)
  );

  // Calculate project statistics with proper typing
  const projectStats: ProjectWithStats[] = projects.map(project => {
    const projectTasks = clientTasks.filter(task => task.project_id === project.id);
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      deadline: project.deadline,
      progress,
      totalTasks,
      completedTasks,
      overdueTasks: projectTasks.filter(task => 
        task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
      ).length,
      client_company_name: project.client_company_name,
    };
  });

  const loading = projectsLoading || tasksLoading;

  // Calculate statistics safely
  const totalCompletedTasks = clientTasks.filter(task => task.status === 'completed').length;
  const averageProgress = projectStats.length > 0 
    ? Math.round(projectStats.reduce((acc, curr) => acc + curr.progress, 0) / projectStats.length)
    : 0;

  // Feedback Functions using Redux slice
  const handleOpenFeedback = (projectId: number | null = null) => {
    setSelectedProjectForFeedback(projectId);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (feedbackData: FeedbackData) => {
    try {
      if (!feedbackData.content.trim()) {
        alert('Please enter feedback content');
        return;
      }

      await dispatch(addComment({
        content: feedbackData.content,
        projectId: feedbackData.projectId  
      }) as any).unwrap();
      
      alert('Thank you for your feedback! It has been submitted successfully.');
      setShowFeedbackModal(false);
      
      // Reset form
      setSelectedProjectForFeedback(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    }
  };

  // Rating Functions using Redux slice
  const handleOpenRating = (projectId: number | null = null) => {
    setSelectedProjectForRating(projectId);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (ratingData: RatingData) => {
    try {
      if (ratingData.rating === 0) {
        alert('Please select a rating');
        return;
      }

      await dispatch(addOrUpdateRating({
        rating: ratingData.rating,
        comment: ratingData.comment,
        projectId: ratingData.projectId
      }) as any).unwrap();
      
      alert('Thank you for your rating! Your feedback helps us improve.');
      setShowRatingModal(false);
      
      // Reset form
      setSelectedProjectForRating(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('There was an error submitting your rating. Please try again.');
    }
  };

  // Load comments and ratings for a specific project
  const handleLoadProjectFeedback = (projectId: number) => {
    dispatch(fetchComments({ projectId }) as any);
    dispatch(fetchRatings({ projectId }) as any);
    dispatch(fetchAverageRating({ projectId }) as any);
  };

  // Quick Actions
  const handleRequestUpdate = (projectId: number) => {
    console.log('Requesting update for project:', projectId);
    alert('Update request has been sent to the project team.');
  };

  const handleViewDeliverables = (projectId: number) => {
    console.log('Viewing deliverables for project:', projectId);
    alert('Opening project deliverables...');
  };

  if (loading) return <div className={styles.loading}>Loading Client Dashboard...</div>;

  return (
    <div className={styles.clientDashboard}>
      <div className={styles.dashboardHeader}>
        <h1>Client Dashboard</h1>
        <TextType
          text={["Welcome Client", "Track your project progress"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="|"
        />
      </div>

      {/* Client Stats */}
      <div className={styles.statsGrid}>
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
            <h3>{averageProgress}%</h3>
            <p>Average Progress</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.completed}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>{totalCompletedTasks}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.notification}`}>
            <FaBell />
          </div>
          <div className={styles.statInfo}>
            <h3>0</h3>
            <p>Pending Reviews</p>
          </div>
        </div>
      </div>

      {/* Client Features */}
      <div className={styles.clientFeatures}>
        <h2>Client Controls</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <FaComment className={styles.featureIcon} />
            <h3>Provide Feedback</h3>
            <p>Give feedback and comments on deliverables and progress</p>
            <button 
              className={styles.featureBtn}
              onClick={() => handleOpenFeedback()}
            >
              Give Feedback
            </button>
          </div>

          <div className={styles.featureCard}>
            <FaStar className={styles.featureIcon} />
            <h3>Satisfaction Rating</h3>
            <p>Rate project satisfaction and provide feedback for improvements</p>
            <button 
              className={styles.featureBtn}
              onClick={() => handleOpenRating()}
            >
              Rate Project
            </button>
          </div>
        </div>
      </div>

      {/* Project Progress */}
      <div className={styles.projectProgress}>
        <h2>Project Progress</h2>
        <div className={styles.projectsList}>
          {projectStats.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project}
              onOpenFeedback={handleOpenFeedback}
              onOpenRating={handleOpenRating}
              onRequestUpdate={handleRequestUpdate}
              onLoadFeedback={() => handleLoadProjectFeedback(project.id)}
            />
          ))}
        </div>
      </div>

      {/* Recent Deliverables */}
      <div className={styles.recentDeliverables}>
        <h2>Recent Deliverables</h2>
        <div className={styles.deliverablesList}>
          {clientTasks
            .filter(task => task.status === 'completed')
            .slice(0, 5)
            .map(task => (
              <div key={task.id} className={styles.deliverableItem}>
                <div className={styles.deliverableInfo}>
                  <h4>{task.title}</h4>
                  <p>Project: {task.project_name || 'Unknown Project'}</p>
                  <span className={styles.completionDate}>
                    Completed: {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.deliverableActions}>
                  <button 
                    className={styles.deliverableBtn}
                    onClick={() => handleOpenFeedback(task.project_id)}
                  >
                    <FaComment /> Provide Feedback
                  </button>
                </div>
              </div>
            ))}
        </div>
        
        {clientTasks.filter(task => task.status === 'completed').length === 0 && (
          <div className={styles.noDeliverables}>
            <p>No deliverables available yet.</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          projectId={selectedProjectForFeedback}
          projects={projects}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedProjectForFeedback(null);
          }}
          onSubmit={handleSubmitFeedback}
          loading={addCommentLoading}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          projectId={selectedProjectForRating}
          projects={projects}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedProjectForRating(null);
          }}
          onSubmit={handleSubmitRating}
          loading={addRatingLoading}
        />
      )}
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: ProjectWithStats;
  onOpenFeedback: (projectId: number) => void;
  onOpenRating: (projectId: number) => void;
  onRequestUpdate: (projectId: number) => void;
  onLoadFeedback: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpenFeedback,
  onOpenRating,
  onRequestUpdate,
  onLoadFeedback
}) => {
  // Get project-specific comments and ratings
  const projectComments = useSelector((state: RootState) => selectCommentsByProject(project.id)(state));
  const projectRatings = useSelector((state: RootState) => selectRatingsByProject(project.id)(state));
  const averageRating = useSelector((state: RootState) => selectAverageRatingByProject(project.id)(state));

  useEffect(() => {
    onLoadFeedback();
  }, [onLoadFeedback]);

  const renderStars = (rating: number): JSX.Element[] => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <span
          key={starValue}
          className={`${styles.star} ${starValue <= rating ? styles.filled : ''}`}
        >
          {starValue <= rating ? '★' : '☆'}
        </span>
      );
    });
  };

  return (
    <div className={styles.projectCard}>
      <div className={styles.projectHeader}>
        <h3>{project.name}</h3>
        <span className={`${styles.projectStatus} ${styles[project.status]}`}>
          {project.status}
        </span>
      </div>
      
      <p className={styles.projectDescription}>{project.description}</p>
      
      {/* Project Rating Summary */}
      {averageRating && averageRating.average_rating > 0 && (
        <div className={styles.projectRatingSummary}>
          <div className={styles.ratingStars}>
            {renderStars(Math.round(averageRating.average_rating))}
            <span className={styles.ratingText}>
              ({averageRating.average_rating.toFixed(1)} from {averageRating.total_ratings} ratings)
            </span>
          </div>
        </div>
      )}
      
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>Overall Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      <div className={styles.projectStats}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{project.totalTasks}</span>
          <span className={styles.statLabel}>Total Tasks</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{project.completedTasks}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{project.overdueTasks}</span>
          <span className={styles.statLabel}>Overdue</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{projectComments.length}</span>
          <span className={styles.statLabel}>Comments</span>
        </div>
      </div>

      {project.deadline && (
        <div className={styles.projectDeadline}>
          <FaClock className={styles.deadlineIcon} />
          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
        </div>
      )}

      {/* Recent Comments Preview */}
      {projectComments.length > 0 && (
        <div className={styles.recentComments}>
          <h4>Recent Feedback</h4>
          {projectComments.slice(0, 2).map(comment => (
            <div key={comment.id} className={styles.commentPreview}>
              <div className={styles.commentAuthor}>{comment.author_name}</div>
              <div className={styles.commentContent}>{comment.content}</div>
              <div className={styles.commentDate}>
                {new Date(comment.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {projectComments.length > 2 && (
            <div className={styles.moreComments}>
              +{projectComments.length - 2} more comments
            </div>
          )}
        </div>
      )}

      {/* Project-specific actions */}
      <div className={styles.projectActions}>
        <button 
          className={styles.projectActionBtn}
          onClick={() => onOpenFeedback(project.id)}
        >
          <FaComment /> Feedback
        </button>
        <button 
          className={styles.projectActionBtn}
          onClick={() => onOpenRating(project.id)}
        >
          <FaStar /> Rate
        </button>
        <button 
          className={styles.projectActionBtn}
          onClick={() => onRequestUpdate(project.id)}
        >
          <FaBell /> Request Update
        </button>
      </div>
    </div>
  );
};

// Feedback Modal Component
interface FeedbackModalProps {
  projectId: number | null;
  projects: any[];
  onClose: () => void;
  onSubmit: (feedbackData: FeedbackData) => void;
  loading: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  projectId, 
  projects, 
  onClose, 
  onSubmit, 
  loading 
}) => {
  const [formData, setFormData] = useState<FeedbackData>({
    projectId: projectId,
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('Please enter your feedback');
      return;
    }

    await onSubmit(formData);
  };

  const selectedProject = projects.find(p => p.id === projectId);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>
            {selectedProject ? `Feedback for ${selectedProject.name}` : 'Provide Feedback'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.feedbackForm} onSubmit={handleSubmit}>
          {!projectId && (
            <div className={styles.formGroup}>
              <label>Project (Optional)</label>
              <select
                value={formData.projectId || ''}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value ? parseInt(e.target.value) : null })}
                disabled={loading}
              >
                <option value="">General Feedback</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Your Feedback *</label>
            <textarea 
              placeholder="Please provide detailed feedback about the project, deliverables, or overall experience..."
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FaSave /> Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rating Modal Component
interface RatingModalProps {
  projectId: number | null;
  projects: any[];
  onClose: () => void;
  onSubmit: (ratingData: RatingData) => void;
  loading: boolean;
}

const RatingModal: React.FC<RatingModalProps> = ({ 
  projectId, 
  projects, 
  onClose, 
  onSubmit, 
  loading 
}) => {
  const [formData, setFormData] = useState<RatingData>({
    projectId: projectId,
    rating: 0,
    comment: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      alert('Please select a rating');
      return;
    }

    await onSubmit(formData);
  };

  const selectedProject = projects.find(p => p.id === projectId);

  const renderStars = (interactive: boolean = true): JSX.Element[] => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={starValue}
          type="button"
          className={`${styles.star} ${starValue <= formData.rating ? styles.active : ''}`}
          onClick={() => interactive && setFormData({ ...formData, rating: starValue })}
          disabled={!interactive || loading}
        >
          <FaStar />
        </button>
      );
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>
            {selectedProject ? `Rate ${selectedProject.name}` : 'Rate Your Experience'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.ratingForm} onSubmit={handleSubmit}>
          {!projectId && (
            <div className={styles.formGroup}>
              <label>Project (Optional)</label>
              <select
                value={formData.projectId || ''}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value ? parseInt(e.target.value) : null })}
                disabled={loading}
              >
                <option value="">Overall Experience</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Overall Rating *</label>
            <div className={styles.starRating}>
              {renderStars()}
            </div>
            <div className={styles.ratingLabel}>
              {formData.rating === 0 && 'Select a rating'}
              {formData.rating === 1 && 'Poor'}
              {formData.rating === 2 && 'Fair'}
              {formData.rating === 3 && 'Good'}
              {formData.rating === 4 && 'Very Good'}
              {formData.rating === 5 && 'Excellent'}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Additional Comments (Optional)</label>
            <textarea 
              placeholder="What did you like most? Any suggestions for improvement?"
              rows={4}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={loading || formData.rating === 0}
            >
              {loading ? (
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

export default ClientDashboard;