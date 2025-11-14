import React, { useEffect, useState, type JSX } from 'react';
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
  FaSave,
  FaRoad
} from 'react-icons/fa';
import styles from './ClientTaskPage.module.css';

// Import comments and ratings slice
import {
  fetchComments,
  addComment,
  fetchRatings,
  addOrUpdateRating,
  fetchAverageRating,
} from '../../store/slices/commentsRatingsSlice';
import {
   selectCommentsByTask,
  selectRatingsByTask,
  selectAverageRatingByTask,
  selectUserRatingForTask,
  selectAddCommentLoading,
  selectAddRatingLoading
} from '../../store/slices/commentsRatingsSelectors';

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
  content: string;
}

interface RatingData {
  taskId: number;
  rating: number;
  comment: string;
}

const ClientTaskPage: React.FC = () => {
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Comments and ratings state
  const addCommentLoading = useSelector(selectAddCommentLoading);
  const addRatingLoading = useSelector(selectAddRatingLoading);
  
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

  // Feedback Functions using Redux
  const handleOpenFeedback = (task: Task) => {
    setSelectedTask(task);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (feedbackData: FeedbackData) => {
    try {
      await dispatch(addComment({
        content: feedbackData.content,
        taskId: feedbackData.taskId
      }) as any).unwrap();
      
      alert('Thank you for your feedback! It has been submitted to the development team.');
      setShowFeedbackModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    }
  };

  // Rating Functions using Redux
  const handleOpenRating = (task: Task) => {
    setSelectedTask(task);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (ratingData: RatingData) => {
    try {
      await dispatch(addOrUpdateRating({
        rating: ratingData.rating,
        comment: ratingData.comment,
        taskId: ratingData.taskId
      }) as any).unwrap();
      
      alert('Thank you for your rating! Your feedback helps improve our work quality.');
      setShowRatingModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('There was an error submitting your rating. Please try again.');
    }
  };

  // Load task feedback data
  const handleLoadTaskFeedback = (taskId: number) => {
    dispatch(fetchComments({ taskId }) as any);
    dispatch(fetchRatings({ taskId }) as any);
    dispatch(fetchAverageRating({ taskId }) as any);
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
            <TaskCard 
              key={task.id}
              task={task}
              onViewDetails={handleViewTaskDetails}
              onOpenFeedback={handleOpenFeedback}
              onOpenRating={handleOpenRating}
              onRequestClarification={handleRequestClarification}
              onLoadFeedback={handleLoadTaskFeedback}
            />
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
          loading={addCommentLoading}
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
          loading={addRatingLoading}
        />
      )}
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  onViewDetails: (task: Task) => void;
  onOpenFeedback: (task: Task) => void;
  onOpenRating: (task: Task) => void;
  onRequestClarification: (task: Task) => void;
  onLoadFeedback: (taskId: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onViewDetails,
  onOpenFeedback,
  onOpenRating,
  onRequestClarification,
  onLoadFeedback
}) => {
  // Get task-specific comments and ratings
  const taskComments = useSelector((state: RootState) => 
    selectCommentsByTask(task.id)(state)
  );
  const taskRatings = useSelector((state: RootState) => 
    selectRatingsByTask(task.id)(state)
  );
  const averageRating = useSelector((state: RootState) => 
    selectAverageRatingByTask(task.id)(state)
  );
  const userRating = useSelector((state: RootState) => 
    selectUserRatingForTask(task.id, task.assigned_to)(state)
  );

  useEffect(() => {
    onLoadFeedback(task.id);
  }, [task.id, onLoadFeedback]);

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
    <div className={styles.taskCard}>
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

      {/* Task Rating Summary */}
      {averageRating && averageRating.average_rating > 0 && (
        <div className={styles.taskRatingSummary}>
          <div className={styles.ratingStars}>
            {renderStars(Math.round(averageRating.average_rating))}
            <span className={styles.ratingText}>
              ({averageRating.average_rating.toFixed(1)} from {averageRating.total_ratings} ratings)
            </span>
          </div>
        </div>
      )}

      {/* User's Rating */}
      {userRating && (
        <div className={styles.userRating}>
          <strong>Your Rating:</strong>
          <div className={styles.userRatingStars}>
            {renderStars(userRating.rating)}
          </div>
        </div>
      )}

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
        <div className={styles.detailItem}>
          <strong>Feedback:</strong>
          <span>{taskComments.length} comments</span>
        </div>
      </div>

      {/* Recent Comments Preview */}
      {taskComments.length > 0 && (
        <div className={styles.recentComments}>
          <h4>Recent Feedback</h4>
          {taskComments.slice(0, 2).map(comment => (
            <div key={comment.id} className={styles.commentPreview}>
              <div className={styles.commentAuthor}>{comment.author_name}</div>
              <div className={styles.commentContent}>{comment.content}</div>
              <div className={styles.commentDate}>
                {new Date(comment.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {taskComments.length > 2 && (
            <div className={styles.moreComments}>
              +{taskComments.length - 2} more comments
            </div>
          )}
        </div>
      )}

      {/* Client Actions */}
      <div className={styles.taskActions}>
        <button 
          className={styles.btnInfo}
          onClick={() => onViewDetails(task)}
        >
          <FaEye /> Details
        </button>
        <button 
          className={styles.btnSuccess}
          onClick={() => onOpenRating(task)}
        >
          <FaStar /> {userRating ? 'Update Rating' : 'Rate'}
        </button>
        <button 
          className={styles.btnSecondary}
          onClick={() => onOpenFeedback(task)}
        >
          <FaComment /> Feedback
        </button>
        <button 
          className={styles.btnWarning}
          onClick={() => onRequestClarification(task)}
        >
          <FaComment /> Request Clarification
        </button>
      </div>
    </div>
  );
};

// Feedback Modal Component
interface FeedbackModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (feedbackData: FeedbackData) => void;
  loading: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  task, 
  onClose, 
  onSubmit, 
  loading 
}) => {
  const [formData, setFormData] = useState<FeedbackData>({
    taskId: task.id,
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
            <label>Your Feedback *</label>
            <textarea 
              placeholder="Please provide detailed feedback about this specific task..."
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
  task: Task;
  onClose: () => void;
  onSubmit: (ratingData: RatingData) => void;
  loading: boolean;
}

const RatingModal: React.FC<RatingModalProps> = ({ 
  task, 
  onClose, 
  onSubmit, 
  loading 
}) => {
  // Get user's existing rating for this task
  const userRating = useSelector((state: RootState) => 
    selectUserRatingForTask(task.id, task.assigned_to)(state)
  );

  const [formData, setFormData] = useState<RatingData>({
    taskId: task.id,
    rating: userRating?.rating || 0,
    comment: userRating?.comment || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      alert('Please select a rating');
      return;
    }

    await onSubmit(formData);
  };

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
          <h2>Rate Task: {task.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.taskContext}>
          <p><strong>Project:</strong> {task.project_name}</p>
          <p><strong>Task:</strong> {task.title}</p>
          {userRating && (
            <p className={styles.existingRating}>
              <em>You previously rated this task {userRating.rating} stars</em>
            </p>
          )}
        </div>

        <form className={styles.ratingForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Task Quality Rating *</label>
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
              placeholder="What did you like about the work? Any suggestions for improvement?"
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

export default ClientTaskPage;