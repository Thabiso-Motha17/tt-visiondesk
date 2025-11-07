import React, { useEffect, useState } from 'react';
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
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

interface RatingData {
  projectId: number | null;
  rating: number;
  comments: string;
  wouldRecommend: boolean;
}

const ClientDashboard: React.FC = () => {
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
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

  // Feedback Functions
  const handleOpenFeedback = (projectId: number | null = null) => {
    setSelectedProjectForFeedback(projectId);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (feedbackData: FeedbackData) => {
    try {
      // Here you would typically send the feedback to your API
      console.log('Submitting feedback:', feedbackData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Thank you for your feedback! It has been submitted successfully.');
      setShowFeedbackModal(false);
      
      // Reset form
      setSelectedProjectForFeedback(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    }
  };

  // Rating Functions
  const handleOpenRating = (projectId: number | null = null) => {
    setSelectedProjectForRating(projectId);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (ratingData: RatingData) => {
    try {
      // Here you would typically send the rating to your API
      console.log('Submitting rating:', ratingData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Thank you for your rating! Your feedback helps us improve.');
      setShowRatingModal(false);
      
      // Reset form
      setSelectedProjectForRating(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('There was an error submitting your rating. Please try again.');
    }
  };

  // Quick Actions
  const handleRequestUpdate = (projectId: number) => {
    // This could open a modal or send a notification
    console.log('Requesting update for project:', projectId);
    alert('Update request has been sent to the project team.');
  };

  const handleViewDeliverables = (projectId: number) => {
    // Navigate to deliverables page or open modal
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
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h3>{project.name}</h3>
                <span className={`${styles.projectStatus} ${styles[project.status]}`}>
                  {project.status}
                </span>
              </div>
              
              <p className={styles.projectDescription}>{project.description}</p>
              
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
              </div>

              {project.deadline && (
                <div className={styles.projectDeadline}>
                  <FaClock className={styles.deadlineIcon} />
                  <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}

              {/* Project-specific actions */}
              <div className={styles.projectActions}>
                <button 
                  className={styles.projectActionBtn}
                  onClick={() => handleOpenFeedback(project.id)}
                >
                  <FaComment /> Feedback
                </button>
                <button 
                  className={styles.projectActionBtn}
                  onClick={() => handleOpenRating(project.id)}
                >
                  <FaStar /> Rate
                </button>
                <button 
                  className={styles.projectActionBtn}
                  onClick={() => handleRequestUpdate(project.id)}
                >
                  <FaBell /> Request Update
                </button>
              </div>
            </div>
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
        />
      )}
    </div>
  );
};

// Feedback Modal Component
interface FeedbackModalProps {
  projectId: number | null;
  projects: any[];
  onClose: () => void;
  onSubmit: (feedbackData: FeedbackData) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ projectId, projects, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FeedbackData>({
    projectId: projectId,
    subject: '',
    message: '',
    priority: 'medium'
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
                disabled={submitting}
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
            <label>Subject *</label>
            <input 
              type="text" 
              placeholder="Brief subject for your feedback"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
              disabled={submitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Message *</label>
            <textarea 
              placeholder="Please provide detailed feedback about the project, deliverables, or overall experience..."
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
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
}

const RatingModal: React.FC<RatingModalProps> = ({ projectId, projects, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<RatingData>({
    projectId: projectId,
    rating: 5,
    comments: '',
    wouldRecommend: true
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

  const selectedProject = projects.find(p => p.id === projectId);

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
                disabled={submitting}
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
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${star <= formData.rating ? styles.active : ''}`}
                  onClick={() => setFormData({ ...formData, rating: star })}
                  disabled={submitting}
                >
                  <FaStar />
                </button>
              ))}
            </div>
            <div className={styles.ratingLabel}>
              {formData.rating === 1 && 'Poor'}
              {formData.rating === 2 && 'Fair'}
              {formData.rating === 3 && 'Good'}
              {formData.rating === 4 && 'Very Good'}
              {formData.rating === 5 && 'Excellent'}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Would you recommend our services? *</label>
            <div className={styles.recommendOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="recommend"
                  checked={formData.wouldRecommend}
                  onChange={() => setFormData({ ...formData, wouldRecommend: true })}
                  disabled={submitting}
                />
                <span>Yes, definitely</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="recommend"
                  checked={!formData.wouldRecommend}
                  onChange={() => setFormData({ ...formData, wouldRecommend: false })}
                  disabled={submitting}
                />
                <span>No, probably not</span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Additional Comments</label>
            <textarea 
              placeholder="What did you like most? Any suggestions for improvement?"
              rows={4}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
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