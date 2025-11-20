/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, } from 'react';
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
  FaEye,
  FaTimes,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import styles from './ClientTaskPage.module.css';

// Import ratings functionality
import {
  fetchTaskRatings,
  addTaskRating,
  selectTaskRatings,
  selectTaskAverageRating,
  selectUserTaskRating,
  selectTaskRatingByType,
  type TaskRating
} from '../../store/slices/ratingsSlice';

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

const ClientTaskPage: React.FC = () => {
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const dispatch = useDispatch();
  
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<Task | null>(null);

  useEffect(() => {
    dispatch(fetchTasks() as any);
    dispatch(fetchProjects() as any);
  }, [dispatch]);

  // Filter tasks for client's projects
  const clientTasks = tasks.filter((task: Task) => 
    projects.some(project => project.id === task.project_id)
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

  // Fetch ratings for all tasks when component mounts
  useEffect(() => {
    if (filteredTasks.length > 0 && user?.id) {
      filteredTasks.forEach(task => {
        dispatch(fetchTaskRatings(task.id) as any);
      });
    }
  }, [dispatch, filteredTasks, user?.id]);

  // Rating Functions
  const handleOpenRatingModal = (task: Task) => {
    setShowRatingModal(task);
  };

  const handleSubmitRating = async (taskId: number, ratingData: {
    rating: number;
    comment: string;
    rating_type: 'quality' | 'communication' | 'timeliness' | 'overall';
  }) => {
    try {
      await dispatch(addTaskRating({
        taskId,
        ratingData
      }) as any);
      
      alert('Thank you for your rating!');
      setShowRatingModal(null);
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
    setSelectedTask(task);
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
              onRequestClarification={handleRequestClarification}
              onRateTask={handleOpenRatingModal}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className={styles.noTasks}>
            <p>No tasks found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDownloadDetails={() => handleDownloadTaskDetails(selectedTask)}
          onRequestClarification={() => handleRequestClarification(selectedTask)}
          onRateTask={() => handleOpenRatingModal(selectedTask)}
        />
      )}

      {/* Task Rating Modal */}
      {showRatingModal && (
        <TaskRatingModal
          task={showRatingModal}
          onClose={() => setShowRatingModal(null)}
          onSubmit={handleSubmitRating}
        />
      )}
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  onViewDetails: (task: Task) => void;
  onRequestClarification: (task: Task) => void;
  onRateTask: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onViewDetails,
  onRequestClarification,
  onRateTask
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const taskRatings = useSelector((state: RootState) => 
    selectTaskRatings(state, task.id)
  );
  const averageRating = useSelector((state: RootState) => 
    selectTaskAverageRating(state, task.id)
  );
  const userQualityRating = useSelector((state: RootState) => 
    selectUserTaskRating(state, task.id, user?.id || 0, 'quality')
  );

  // Fetch ratings when component mounts
  useEffect(() => {
    dispatch(fetchTaskRatings(task.id) as any);
  }, [dispatch, task.id]);

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
          {/* Average Rating Display */}
          {averageRating > 0 && (
            <div className={styles.averageRating}>
              <FaStar className={styles.starIcon} />
              <span>{averageRating.toFixed(1)}</span>
            </div>
          )}
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

      {/* User's Current Rating Display */}
      {userQualityRating && (
        <div className={styles.userRating}>
          <span>Your quality rating: </span>
          <div className={styles.userRatingStars}>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} className={star <= userQualityRating.rating ? styles.starFilled : styles.starEmpty}>
                {star <= userQualityRating.rating ? <FaStar /> : <FaRegStar />}
              </span>
            ))}
          </div>
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
          onClick={() => onRateTask(task)}
        >
          <FaStar /> {userQualityRating ? 'Update Rating' : 'Rate Task'}
        </button>
      </div>
    </div>
  );
};

// Task Details Modal Component
interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onDownloadDetails: () => void;
  onRequestClarification: () => void;
  onRateTask: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  onDownloadDetails,
  onRequestClarification,
  onRateTask
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const taskRatings = useSelector((state: RootState) => 
    selectTaskRatings(state, task.id)
  );
  const averageRating = useSelector((state: RootState) => 
    selectTaskAverageRating(state, task.id)
  );
  const userQualityRating = useSelector((state: RootState) => 
    selectUserTaskRating(state, task.id, user?.id || 0, 'quality')
  );
  const userCommunicationRating = useSelector((state: RootState) => 
    selectUserTaskRating(state, task.id, user?.id || 0, 'communication')
  );
  const userTimelinessRating = useSelector((state: RootState) => 
    selectUserTaskRating(state, task.id, user?.id || 0, 'timeliness')
  );

  // Fetch ratings when modal opens
  useEffect(() => {
    dispatch(fetchTaskRatings(task.id) as any);
  }, [dispatch, task.id]);

  // Calculate average ratings by type
  const getAverageRatingByType = (ratingType: string) => {
    const typeRatings = taskRatings.filter(rating => rating.rating_type === ratingType);
    if (typeRatings.length === 0) return 0;
    
    const sum = typeRatings.reduce((total, rating) => total + rating.rating, 0);
    return sum / typeRatings.length;
  };

  const qualityAvg = getAverageRatingByType('quality');
  const communicationAvg = getAverageRatingByType('communication');
  const timelinessAvg = getAverageRatingByType('timeliness');

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Task Details: {task.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Rating Summary */}
          {averageRating > 0 && (
            <div className={styles.ratingSummary}>
              <h3>Task Ratings</h3>
              <div className={styles.ratingOverview}>
                <div className={styles.averageRating}>
                  <span className={styles.ratingValue}>{averageRating.toFixed(1)}</span>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={star <= Math.round(averageRating) ? styles.starFilled : styles.starEmpty}>
                        {star <= Math.round(averageRating) ? <FaStar /> : <FaRegStar />}
                      </span>
                    ))}
                  </div>
                  <span className={styles.ratingCount}>({taskRatings.length} ratings)</span>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className={styles.ratingBreakdown}>
                <div className={styles.ratingType}>
                  <span>Quality:</span>
                  <div className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={star <= Math.round(qualityAvg) ? styles.starFilled : styles.starEmpty}>
                        {star <= Math.round(qualityAvg) ? <FaStar /> : <FaRegStar />}
                      </span>
                    ))}
                    <span className={styles.ratingValue}>({qualityAvg.toFixed(1)})</span>
                  </div>
                </div>
                <div className={styles.ratingType}>
                  <span>Communication:</span>
                  <div className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={star <= Math.round(communicationAvg) ? styles.starFilled : styles.starEmpty}>
                        {star <= Math.round(communicationAvg) ? <FaStar /> : <FaRegStar />}
                      </span>
                    ))}
                    <span className={styles.ratingValue}>({communicationAvg.toFixed(1)})</span>
                  </div>
                </div>
                <div className={styles.ratingType}>
                  <span>Timeliness:</span>
                  <div className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={star <= Math.round(timelinessAvg) ? styles.starFilled : styles.starEmpty}>
                        {star <= Math.round(timelinessAvg) ? <FaStar /> : <FaRegStar />}
                      </span>
                    ))}
                    <span className={styles.ratingValue}>({timelinessAvg.toFixed(1)})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.taskInfo}>
            <div className={styles.infoSection}>
              <h3>Description</h3>
              <p>{task.description}</p>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>Project:</strong>
                <span>{task.project_name}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Status:</strong>
                <span className={`${styles.statusBadge} ${styles[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <div className={styles.infoItem}>
                <strong>Priority:</strong>
                <span className={`${styles.priorityBadge} ${styles[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              {task.deadline && (
                <div className={styles.infoItem}>
                  <strong>Deadline:</strong>
                  <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? styles.overdue : ''}>
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className={styles.infoItem}>
                <strong>Assigned To:</strong>
                <span>{task.assigned_name || 'Not assigned'}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Created:</strong>
                <span>{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className={styles.progressSection}>
            <h3>Progress</h3>
            <div className={styles.progressContainer}>
              <div className={styles.progressInfo}>
                <span>Current Progress</span>
                <span>{task.progress_percentage}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${
                    task.progress_percentage < 50 ? styles.low :
                    task.progress_percentage < 80 ? styles.medium : styles.high
                  }`}
                  style={{ width: `${task.progress_percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
          <button className={styles.btnSuccess} onClick={onRateTask}>
            <FaStar /> {userQualityRating ? 'Update Rating' : 'Rate Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Task Rating Modal Component
interface TaskRatingModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (taskId: number, ratingData: {
    rating: number;
    comment: string;
    rating_type: 'quality' | 'communication' | 'timeliness' | 'overall';
  }) => void;
}

const TaskRatingModal: React.FC<TaskRatingModalProps> = ({
  task,
  onClose,
  onSubmit
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userQualityRating = useSelector((state: RootState) => 
    selectUserTaskRating(state, task.id, user?.id || 0, 'quality')
  );
  const userCommunicationRating = useSelector((state: RootState) => 
    selectUserTaskRating(state, task.id, user?.id || 0, 'communication')
  );
  const userTimelinessRating = useSelector((state: RootState) => 
    selectUserTaskRating(state, task.id, user?.id || 0, 'timeliness')
  );

  const [ratings, setRatings] = useState({
    quality: userQualityRating?.rating || 0,
    communication: userCommunicationRating?.rating || 0,
    timeliness: userTimelinessRating?.rating || 0,
  });
  const [comments, setComments] = useState({
    quality: userQualityRating?.comment || '',
    communication: userCommunicationRating?.comment || '',
    timeliness: userTimelinessRating?.comment || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [hoverRatings, setHoverRatings] = useState({
    quality: 0,
    communication: 0,
    timeliness: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one rating is provided
    if (ratings.quality === 0 && ratings.communication === 0 && ratings.timeliness === 0) {
      alert('Please provide at least one rating');
      return;
    }

    setSubmitting(true);
    try {
      // Submit each rating type that has a rating
      const submitPromises = [];
      
      if (ratings.quality > 0) {
        submitPromises.push(
          onSubmit(task.id, {
            rating: ratings.quality,
            comment: comments.quality,
            rating_type: 'quality'
          })
        );
      }
      
      if (ratings.communication > 0) {
        submitPromises.push(
          onSubmit(task.id, {
            rating: ratings.communication,
            comment: comments.communication,
            rating_type: 'communication'
          })
        );
      }
      
      if (ratings.timeliness > 0) {
        submitPromises.push(
          onSubmit(task.id, {
            rating: ratings.timeliness,
            comment: comments.timeliness,
            rating_type: 'timeliness'
          })
        );
      }
      
      await Promise.all(submitPromises);
    } catch (error) {
      console.error('Error submitting ratings:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateRating = (type: keyof typeof ratings, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [type]: rating
    }));
  };

  const updateComment = (type: keyof typeof comments, comment: string) => {
    setComments(prev => ({
      ...prev,
      [type]: comment
    }));
  };

  const updateHoverRating = (type: keyof typeof hoverRatings, rating: number) => {
    setHoverRatings(prev => ({
      ...prev,
      [type]: rating
    }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.large}`}>
        <div className={styles.modalHeader}>
          <h2>Rate Task: {task.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.ratingForm} onSubmit={handleSubmit}>
          {/* Quality Rating */}
          <div className={styles.ratingTypeSection}>
            <h4>Quality of Work</h4>
            <div className={styles.formGroup}>
              <label>How would you rate the quality of work?</label>
              <div className={styles.starRating}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.star} ${star <= (hoverRatings.quality || ratings.quality) ? styles.active : ''}`}
                    onClick={() => updateRating('quality', star)}
                    onMouseEnter={() => updateHoverRating('quality', star)}
                    onMouseLeave={() => updateHoverRating('quality', 0)}
                    disabled={submitting}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Comments on Quality (Optional)</label>
              <textarea
                placeholder="Share your thoughts on the quality of work..."
                rows={2}
                value={comments.quality}
                onChange={(e) => updateComment('quality', e.target.value)}
                disabled={submitting}
              />
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
              disabled={submitting || (ratings.quality === 0 )}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FaStar /> Submit Ratings
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