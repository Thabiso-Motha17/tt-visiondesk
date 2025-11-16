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
  FaDownload,
  FaTimes,
  FaRoad
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

const ClientTaskPage: React.FC = () => {
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const dispatch = useDispatch();
  
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onViewDetails,
  onRequestClarification
}) => {
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
          onClick={() => onViewDetails(task)}
        >
          <FaEye /> Details
        </button>
        <button 
          className={styles.btnWarning}
          onClick={() => onRequestClarification(task)}
        >
          <FaExclamationTriangle /> Request Clarification
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
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  onDownloadDetails,
  onRequestClarification
}) => {
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
          <button className={styles.btnWarning} onClick={onRequestClarification}>
            <FaExclamationTriangle /> Request Clarification
          </button>
          <button className={styles.btnPrimary} onClick={onDownloadDetails}>
            <FaDownload /> Download Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientTaskPage;