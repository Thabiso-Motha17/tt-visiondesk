import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store.ts';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaFilter,
  FaSearch,
  FaUser,
  FaProjectDiagram,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaListAlt,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import styles from './AdminTaskPage.module.css';
import { API_URL } from '../../../api.ts';

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

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface CreateTaskData {
  title: string;
  description: string;
  project_id: number;
  assigned_to?: number;
  status: string;
  priority: string;
  progress_percentage: number;
  deadline: string;
}

const AdminTaskPage: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      // Filter only active developers for assignment
      const developers = data.filter((user: User) => 
        user.role === 'developer' && user.is_active
      );
      setUsers(developers);
      console.log('Fetched users:',users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, [token]);

  const handleCreateTask = async (taskData: CreateTaskData) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          created_by: user?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      setShowCreateModal(false);
      
      alert('Task created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      console.error('Error creating task:', err);
    }
  };

  const handleUpdateTask = async (taskData: CreateTaskData) => {
    if (!editingTask) return;

    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? { ...task, ...updatedTask } : task
      ));
      setEditingTask(null);
      
      alert('Task updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      setTasks(tasks.filter(task => task.id !== taskId));
      alert('Task deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  // Filter tasks based on filters and search
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusStats = () => {
    return {
      total: tasks.length,
      completed: tasks.filter(task => task.status === 'completed').length,
      inProgress: tasks.filter(task => task.status === 'in_progress').length,
      blocked: tasks.filter(task => task.status === 'blocked').length,
      notStarted: tasks.filter(task => task.status === 'not_started').length,
    };
  };

  const stats = getStatusStats();

  const refreshData = () => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  };

  if (loading) return <div className={styles.loading}>Loading Tasks...</div>;

  return (
    <div className={styles.adminTaskPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Task Management</h1>
          <p>Create, assign, and monitor all tasks across projects</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={refreshData}>
            Refresh
          </button>
          <button 
            className={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
            disabled={user?.role !== 'manager' && user?.role !== 'admin'}
            title={user?.role !== 'manager' && user?.role !== 'admin' ? "Only managers/admins can create tasks" : "Create new task"}
          >
            <FaPlus /> Create Task
          </button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className={styles.taskStatsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaListAlt />
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
            placeholder="Search tasks by title or description..."
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
          <div className={styles.filterGroup}>
            <label>Priority</label>
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className={styles.tasksTableContainer}>
        <div className={styles.tableHeader}>
          <h2>All Tasks ({filteredTasks.length})</h2>
          <div className={styles.tableActions}>
            <button className={styles.btnSecondary}>
              <FaFilter /> Export
            </button>
          </div>
        </div>

        <div className={styles.tasksTable}>
          <div className={styles.tableHeaderRow}>
            <div className={`${styles.col} ${styles.taskTitle}`}>Task</div>
            <div className={`${styles.col} ${styles.project}`}>Project</div>
            <div className={`${styles.col} ${styles.assignee}`}>Assignee</div>
            <div className={`${styles.col} ${styles.status}`}>Status</div>
            <div className={`${styles.col} ${styles.priority}`}>Priority</div>
            <div className={`${styles.col} ${styles.deadline}`}>Deadline</div>
            <div className={`${styles.col} ${styles.progress}`}>Progress</div>
            <div className={`${styles.col} ${styles.actions}`}>Actions</div>
          </div>

          <div className={styles.tableBody}>
            {filteredTasks.map(task => (
              <div key={task.id} className={styles.tableRow}>
                <div className={`${styles.col} ${styles.taskTitle}`}>
                  <div className={styles.taskMainInfo}>
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                  </div>
                </div>
                <div className={`${styles.col} ${styles.project}`}>
                  <span className={styles.projectBadge}>
                    <FaProjectDiagram />
                    {task.project_name || `Project ${task.project_id}`}
                  </span>
                </div>
                <div className={`${styles.col} ${styles.assignee}`}>
                  <span className={styles.assigneeInfo}>
                    <FaUser />
                    {task.assigned_name || 'Unassigned'}
                  </span>
                </div>
                <div className={`${styles.col} ${styles.status}`}>
                  <span className={`${styles.statusBadge} ${styles[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <div className={`${styles.col} ${styles.priority}`}>
                  <span className={`${styles.priorityBadge} ${styles[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className={`${styles.col} ${styles.deadline}`}>
                  {task.deadline ? (
                    <span className={`${styles.deadline} ${
                      new Date(task.deadline) < new Date() && task.status !== 'completed' ? styles.overdue : ''
                    }`}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className={styles.noDeadline}>No deadline</span>
                  )}
                </div>
                <div className={`${styles.col} ${styles.progress}`}>
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
                <div className={`${styles.col} ${styles.actions}`}>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.btnEdit} 
                      onClick={() => setEditingTask(task)}
                      disabled={user?.role !== 'manager' && user?.role !== 'admin'}
                      title={user?.role !== 'manager' && user?.role !== 'admin' ? "Only managers/admins can edit tasks" : "Edit task"}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className={styles.btnDelete} 
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={user?.role !== 'manager' && user?.role !== 'admin'}
                      title={user?.role !== 'manager' && user?.role !== 'admin' ? "Only managers/admins can delete tasks" : "Delete task"}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && !loading && (
            <div className={styles.noTasks}>
              <FaListAlt className={styles.noTasksIcon} />
              <h3>No Tasks Found</h3>
              <p>
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                  ? 'No tasks match your current filters. Try adjusting your search or filters.'
                  : 'No tasks have been created yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          users={users}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          projects={projects}
          users={users}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
        />
      )}
    </div>
  );
};

// Create Task Modal Component
interface CreateTaskModalProps {
  projects: Project[];
  users: User[];
  onClose: () => void;
  onSubmit: (taskData: CreateTaskData) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ projects, users, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    status: 'not_started',
    priority: 'medium',
    progress_percentage: 0,
    deadline: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        project_id: parseInt(formData.project_id),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
        progress_percentage: parseInt(formData.progress_percentage.toString())
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
        <h2>Create New Task</h2>
        <form className={styles.taskForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Task Title *</label>
              <input 
                type="text" 
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Project *</label>
              <select 
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                required
                disabled={submitting}
              >
                <option value="">Select project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea 
              placeholder="Enter task description" 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={submitting}
            ></textarea>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Assignee</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                disabled={submitting}
              >
                <option value="">Select assignee</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                disabled={submitting}
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
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={submitting}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Progress (%)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={formData.progress_percentage}
                onChange={(e) => setFormData({ ...formData, progress_percentage: parseInt(e.target.value) || 0 })}
                disabled={submitting}
              />
            </div>
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

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={submitting}
            >
              <FaTimes /> Cancel
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
                  <FaSave /> Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Task Modal Component
interface EditTaskModalProps {
  task: Task;
  projects: Project[];
  users: User[];
  onClose: () => void;
  onSubmit: (taskData: CreateTaskData) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, projects, users, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    project_id: task.project_id.toString(),
    assigned_to: task.assigned_to?.toString() || '',
    status: task.status,
    priority: task.priority,
    progress_percentage: task.progress_percentage,
    deadline: task.deadline || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        project_id: parseInt(formData.project_id),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
        progress_percentage: parseInt(formData.progress_percentage.toString())
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
        <h2>Edit Task</h2>
        <form className={styles.taskForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Task Title *</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Project *</label>
              <select 
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                required
                disabled={submitting}
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={submitting}
            ></textarea>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Assignee</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                disabled={submitting}
              >
                <option value="">Select assignee</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                disabled={submitting}
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
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={submitting}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Progress (%)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={formData.progress_percentage}
                onChange={(e) => setFormData({ ...formData, progress_percentage: parseInt(e.target.value) || 0 })}
                disabled={submitting}
              />
            </div>
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

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={submitting}
            >
              <FaTimes /> Cancel
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

export default AdminTaskPage;