import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store.ts';
import { fetchTasks } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { 
  FaProjectDiagram, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaEye,
  FaComment,
  FaDownload,
  FaStar,
  FaTimes,
  FaSave
} from 'react-icons/fa';
import styles from './ClientTaskPage.module.css';

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

interface Project {
  id: number;
  name: string;
}

interface FeedbackData {
  taskId: number;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

interface RatingData {
  taskId: number;
  rating: number;
  comments: string;
  wouldRecommend: boolean;
}

const ClientTaskPage: React.FC = () => {
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    dispatch(fetchTasks() as any);
    dispatch(fetchProjects() as any);
  }, [dispatch]);

  // Filter tasks for client's projects
  const clientTasks = tasks.filter(task => 
    projects.some(project => project.id === (task as any).project_id)
  );

  const filteredTasks = clientTasks.filter(task => {
    const matchesProject = filterProject === 'all' || (task as any).project_id.toString() === filterProject;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesProject && matchesStatus && matchesSearch;
  });

  const stats = {
    total: clientTasks.length,
    completed: clientTasks.filter(task => task.status === 'completed').length,
    inProgress: clientTasks.filter(task => task.status === 'in_progress').length,
    blocked: clientTasks.filter(task => task.status === 'blocked').length,
  };

  // Feedback Functions
  const handleOpenFeedback = (task: Task) => {
    setSelectedTask(task);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (feedbackData: FeedbackData) => {
    try {
      console.log('Submitting task feedback:', feedbackData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Thank you for your feedback! It has been submitted to the development team.');
      setShowFeedbackModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    }
  };

  // Rating Functions
  const handleOpenRating = (task: Task) => {
    setSelectedTask(task);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (ratingData: RatingData) => {
    try {
      console.log('Submitting task rating:', ratingData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Thank you for your rating! Your feedback helps improve our work quality.');
      setShowRatingModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('There was an error submitting your rating. Please try again.');
    }
  };

  // Additional Actions
  const handleRequestClarification = (task: Task) => {
    console.log('Requesting clarification for task:', task.id);
    alert('Clarification request has been sent to the development team.');
  };

  const handleDownloadTaskDetails = (task: Task) => {
    console.log('Downloading task details:', task.id);
    alert('Task details download started...');
  };

  const handleViewTaskDetails = (task: Task) => {
    console.log('Viewing task details:', task.id);
    // This could open a detailed view modal or navigate to a task details page
    alert(`Opening detailed view for: ${task.title}`);
  };

  const loading = tasksLoading || projectsLoading;

  if (loading) return <div className={styles.loading}>Loading Tasks...</div>;

  return (
    <div className={styles.clientTaskPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Project Tasks</h1>
          <p>Monitor task progress across your projects</p>
        </div>
      </div>

      {/* Task Statistics */}
      <div className={styles.taskStatsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaProjectDiagram />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total Tasks</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.completed}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.progress}`}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blocked}`}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.blocked}</h3>
            <p>Blocked</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <label>Project</label>
            <select 
              value={filterProject} 
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Overview */}
      <div className={styles.tasksOverview}>
        <h2>Task Overview ({filteredTasks.length})</h2>
        
        <div className={styles.tasksGrid}>
          {filteredTasks.map(task => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <h3>{task.title}</h3>
                <div className={styles.taskStatusGroup}>
                  <span className={`${styles.statusBadge} ${styles[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`${styles.priorityBadge} ${styles[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <p className={styles.taskDescription}>{task.description}</p>

              <div className={styles.taskDetails}>
                <div className={styles.detailItem}>
                  <strong>Project:</strong>
                  <span>{task.project_name}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Progress:</strong>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div 
                        className={`${styles.progressFill} ${
                          task.progress_percentage < 50 ? styles.low :
                          task.progress_percentage < 80 ? styles.medium : styles.high
                        }`}
                        style={{ width: `${task.progress_percentage}%` }}
                      ></div>
                    </div>
                    <span className={styles.progressText}>{task.progress_percentage}%</span>
                  </div>
                </div>
                {task.deadline && (
                  <div className={styles.detailItem}>
                    <strong>Deadline:</strong>
                    <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? styles.overdue : ''}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <strong>Last Updated:</strong>
                  <span>{new Date(task.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Client Actions */}
              <div className={styles.taskActions}>
                <button 
                  className={styles.btnInfo}
                  onClick={() => handleViewTaskDetails(task)}
                >
                  <FaEye /> Details
                </button>
                <button 
                  className={styles.btnSuccess}
                  onClick={() => handleOpenRating(task)}
                >
                  <FaStar /> Rate
                </button>
                <button 
                  className={styles.btnSecondary}
                  onClick={() => handleOpenFeedback(task)}
                >
                  <FaComment /> Feedback
                </button>
                <button 
                  className={styles.btnWarning}
                  onClick={() => handleRequestClarification(task)}
                >
                  <FaComment /> Request Clarification
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className={styles.noTasks}>
            <p>No tasks found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Completed Tasks Section */}
      <div className={styles.completedTasksSection}>
        <h2>Recently Completed Tasks</h2>
        <div className={styles.completedTasksList}>
          {clientTasks
            .filter(task => task.status === 'completed')
            .slice(0, 5)
            .map(task => (
              <div key={task.id} className={styles.completedTaskItem}>
                <div className={styles.taskInfo}>
                  <h4>{task.title}</h4>
                  <p>{task.project_name}</p>
                  <span className={styles.completionDate}>
                    Completed: {new Date(task.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.taskActions}>
                  <button 
                    className={styles.btnFeedback}
                    onClick={() => handleOpenFeedback(task)}
                  >
                    <FaComment /> Feedback
                  </button>
                  <button 
                    className={styles.btnRating}
                    onClick={() => handleOpenRating(task)}
                  >
                    <FaStar /> Rate
                  </button>
                </div>
              </div>
            ))}
        </div>
        
        {clientTasks.filter(task => task.status === 'completed').length === 0 && (
          <div className={styles.noCompletedTasks}>
            <p>No completed tasks yet.</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedTask && (
        <FeedbackModal
          task={selectedTask}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedTask(null);
          }}
          onSubmit={handleSubmitFeedback}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedTask && (
        <RatingModal
          task={selectedTask}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedTask(null);
          }}
          onSubmit={handleSubmitRating}
        />
      )}
    </div>
  );
};

// Feedback Modal Component
interface FeedbackModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (feedbackData: FeedbackData) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ task, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FeedbackData>({
    taskId: task.id,
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

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Provide Feedback: {task.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.taskContext}>
          <p><strong>Project:</strong> {task.project_name}</p>
          <p><strong>Task:</strong> {task.title}</p>
        </div>

        <form className={styles.feedbackForm} onSubmit={handleSubmit}>
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
              placeholder="Please provide detailed feedback about this specific task..."
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
  task: Task;
  onClose: () => void;
  onSubmit: (ratingData: RatingData) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ task, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<RatingData>({
    taskId: task.id,
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

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Rate Task: {task.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.taskContext}>
          <p><strong>Project:</strong> {task.project_name}</p>
          <p><strong>Task:</strong> {task.title}</p>
        </div>

        <form className={styles.ratingForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Task Quality Rating *</label>
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
            <label>Would you recommend this developer? *</label>
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
              placeholder="What did you like about the work? Any suggestions for improvement?"
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

export default ClientTaskPage;