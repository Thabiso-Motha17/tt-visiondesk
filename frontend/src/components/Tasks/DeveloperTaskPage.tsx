import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { 
  fetchTasks, 
  updateTask,
  clearError as clearTaskError,
  type TaskStatus
} from '../../store/slices/taskSlice';
import { 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaEdit,
  FaSearch,
  FaProjectDiagram,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import styles from './DeveloperTaskPage.module.css';

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

const DeveloperTaskPage: React.FC = () => {
  const { tasks, loading } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [updateLoading, setUpdateLoading] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearTaskError());
    };
  }, [dispatch]);

  // Filter tasks for current developer
  const developerTasks = tasks.filter(task => task.assigned_to === user?.id);
  
  const filteredTasks = developerTasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: developerTasks.length,
    completed: developerTasks.filter(task => task.status === 'completed').length,
    inProgress: developerTasks.filter(task => task.status === 'in_progress').length,
    blocked: developerTasks.filter(task => task.status === 'blocked').length,
    notStarted: developerTasks.filter(task => task.status === 'not_started').length,
  };

  const handleStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setUpdateLoading(taskId);
      
      // First get the current task to preserve other fields
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await dispatch(updateTask({
        taskId,
        taskData: {
          title: task.title,
          description: task.description,
          assigned_to: task.assigned_to,
          priority: task.priority,
          deadline: task.deadline,
          status: newStatus,
          progress_percentage: task.progress_percentage
        }
      })).unwrap();
      
      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to update task status'}`);
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleProgressUpdate = async (taskId: number, progress: number) => {
    try {
      setUpdateLoading(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Auto-update status based on progress
      let newStatus = task.status;
      if (progress === 0 && task.status !== 'not_started') {
        newStatus = 'not_started';
      } else if (progress > 0 && progress < 100 && task.status !== 'in_progress') {
        newStatus = 'in_progress';
      } else if (progress === 100 && task.status !== 'completed') {
        newStatus = 'completed';
      }

      await dispatch(updateTask({
        taskId,
        taskData: {
          title: task.title,
          description: task.description,
          assigned_to: task.assigned_to,
          priority: task.priority,
          deadline: task.deadline,
          status: newStatus,
          progress_percentage: progress
        }
      })).unwrap();
      
      console.log(`Task ${taskId} progress updated to ${progress}%`);
    } catch (err) {
      console.error('Error updating task progress:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to update task progress'}`);
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleQuickUpdate = async (taskId: number, updates: { status?: TaskStatus; progress?: number }) => {
    try {
      setUpdateLoading(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await dispatch(updateTask({
        taskId,
        taskData: {
          title: task.title,
          description: task.description,
          assigned_to: task.assigned_to,
          priority: task.priority,
          deadline: task.deadline,
          status: updates.status || task.status,
          progress_percentage: updates.progress || task.progress_percentage
        }
      })).unwrap();
      
      console.log(`Task ${taskId} updated:`, updates);
    } catch (err) {
      console.error('Error updating task:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to update task'}`);
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleDetailedUpdate = async (taskData: any) => {
    if (!editingTask) return;

    try {
      setUpdateLoading(editingTask.id);
      
      await dispatch(updateTask({
        taskId: editingTask.id,
        taskData: {
          title: taskData.title,
          description: taskData.description,
          assigned_to: editingTask.assigned_to,
          priority: taskData.priority,
          deadline: taskData.deadline,
          status: taskData.status,
          progress_percentage: taskData.progress_percentage
        }
      })).unwrap();
      
      setEditingTask(null);
      alert('Task updated successfully!');
    } catch (err) {
      console.error('Error updating task:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to update task'}`);
    } finally {
      setUpdateLoading(null);
    }
  };

  // Quick action handlers
  const handleStartTask = (taskId: number) => {
    handleQuickUpdate(taskId, { status: 'in_progress', progress: 10 });
  };

  const handleCompleteTask = (taskId: number) => {
    handleQuickUpdate(taskId, { status: 'completed', progress: 100 });
  };

  const handleBlockTask = (taskId: number) => {
    handleQuickUpdate(taskId, { status: 'blocked' });
  };

  if (loading) return <div className={styles.loading}>Loading Tasks...</div>;

  return (
    <div className={styles.developerTaskPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>My Tasks</h1>
          <p>Manage your assigned tasks and update progress</p>
        </div>
      </div>

      {/* Task Statistics */}
      <div className={styles.taskStatsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Assigned Tasks</p>
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
            placeholder="Search my tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterControls}>
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

      {/* Tasks Grid */}
      <div className={styles.tasksContainer}>
        <h2>My Assigned Tasks ({filteredTasks.length})</h2>
        
        <div className={styles.tasksGrid}>
          {filteredTasks.map(task => (
            <div key={task.id} className={`${styles.taskCard} ${styles[task.status]}`}>
              <div className={styles.taskHeader}>
                <h3>{task.title}</h3>
                <span className={`${styles.statusBadge} ${styles[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              <p className={styles.taskDescription}>{task.description}</p>

              <div className={styles.taskMeta}>
                <div className={styles.metaItem}>
                  <FaProjectDiagram />
                  <span>{task.project_name || `Project ${task.project_id}`}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={`${styles.priorityBadge} ${styles[task.priority]}`}>
                    {task.priority} priority
                  </span>
                </div>
                {task.deadline && (
                  <div className={styles.metaItem}>
                    <FaClock />
                    <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? styles.overdue : ''}>
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Section */}
              <div className={styles.progressSection}>
                <label>Progress: {task.progress_percentage}%</label>
                <div className={styles.progressBar}>
                  <div 
                    className={`${styles.progressFill} ${
                      task.progress_percentage < 50 ? styles.low :
                      task.progress_percentage < 80 ? styles.medium : styles.high
                    }`}
                    style={{ width: `${task.progress_percentage}%` }}
                  ></div>
                </div>
                <div className={styles.progressControls}>
                  <button 
                    className={styles.btnProgress}
                    onClick={() => handleProgressUpdate(task.id, Math.max(0, task.progress_percentage - 10))}
                    disabled={updateLoading === task.id}
                  >
                    {updateLoading === task.id ? '...' : '-10%'}
                  </button>
                  <button 
                    className={styles.btnProgress}
                    onClick={() => handleProgressUpdate(task.id, Math.min(100, task.progress_percentage + 10))}
                    disabled={updateLoading === task.id}
                  >
                    {updateLoading === task.id ? '...' : '+10%'}
                  </button>
                  <button 
                    className={styles.btnProgressPrimary}
                    onClick={() => handleProgressUpdate(task.id, 100)}
                    disabled={updateLoading === task.id || task.progress_percentage === 100}
                  >
                    {updateLoading === task.id ? '...' : 'Complete'}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.quickActions}>
                <h4>Quick Actions:</h4>
                <div className={styles.quickActionButtons}>
                  {task.status === 'not_started' && (
                    <button 
                      className={styles.btnQuickStart}
                      onClick={() => handleStartTask(task.id)}
                      disabled={updateLoading === task.id}
                    >
                      {updateLoading === task.id ? '...' : 'Start Task'}
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button 
                      className={styles.btnQuickComplete}
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={updateLoading === task.id}
                    >
                      {updateLoading === task.id ? '...' : 'Mark Complete'}
                    </button>
                  )}
                  {task.status !== 'blocked' && (
                    <button 
                      className={styles.btnQuickBlock}
                      onClick={() => handleBlockTask(task.id)}
                      disabled={updateLoading === task.id}
                    >
                      {updateLoading === task.id ? '...' : 'Report Blocked'}
                    </button>
                  )}
                  {task.status === 'blocked' && (
                    <button 
                      className={styles.btnQuickResume}
                      onClick={() => handleQuickUpdate(task.id, { status: 'in_progress' })}
                      disabled={updateLoading === task.id}
                    >
                      {updateLoading === task.id ? '...' : 'Resume Task'}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Controls */}
              <div className={styles.statusControls}>
                <h4>Update Status:</h4>
                <div className={styles.statusButtons}>
                  <button 
                    className={`${styles.btnStatus} ${task.status === 'not_started' ? styles.active : ''}`}
                    onClick={() => handleStatusUpdate(task.id, 'not_started')}
                    disabled={updateLoading === task.id}
                  >
                    {updateLoading === task.id ? '...' : 'Not Started'}
                  </button>
                  <button 
                    className={`${styles.btnStatus} ${task.status === 'in_progress' ? styles.active : ''}`}
                    onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                    disabled={updateLoading === task.id}
                  >
                    {updateLoading === task.id ? '...' : 'In Progress'}
                  </button>
                  <button 
                    className={`${styles.btnStatus} ${task.status === 'blocked' ? styles.active : ''}`}
                    onClick={() => handleStatusUpdate(task.id, 'blocked')}
                    disabled={updateLoading === task.id}
                  >
                    {updateLoading === task.id ? '...' : 'Blocked'}
                  </button>
                  <button 
                    className={`${styles.btnStatus} ${task.status === 'completed' ? styles.active : ''}`}
                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                    disabled={updateLoading === task.id}
                  >
                    {updateLoading === task.id ? '...' : 'Complete'}
                  </button>
                </div>
              </div>

              {/* Developer Actions */}
              <div className={styles.taskActions}>
                <button 
                  className={styles.btnEdit}
                  onClick={() => setEditingTask(task)}
                  disabled={updateLoading === task.id}
                >
                  <FaEdit /> {updateLoading === task.id ? 'Updating...' : 'Detailed Update'}
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

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleDetailedUpdate}
          loading={updateLoading === editingTask.id}
        />
      )}
    </div>
  );
};

// Edit Task Modal Component
interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
  loading: boolean;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    progress_percentage: task.progress_percentage,
    deadline: task.deadline || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Update Task</h2>
        <form className={styles.taskForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Task Title *</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            ></textarea>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={loading}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Progress (%)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={formData.progress_percentage}
                onChange={(e) => setFormData({ ...formData, progress_percentage: parseInt(e.target.value) || 0 })}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Deadline</label>
              <input 
                type="date" 
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={loading}
            >
              <FaTimes /> Cancel
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave /> Update Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeveloperTaskPage;