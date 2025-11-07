import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { addCommentToTask, fetchTasks, updateTaskStatus, type Comment, type Task, type TaskStatus } from '../../store/slices/taskSlice';
import { 
  FaTasks, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaUpload,
  FaComment,
  FaFileUpload,
  FaQuestionCircle,
  FaUserFriends,
  FaChartLine
} from 'react-icons/fa';
import styles from './DeveloperDashboard.module.css';
import TextType from '../../ui/TextType';
import { Link } from 'react-router-dom';

// Modal components for different features
interface UploadDeliverableModalProps {
  task: Task | null;
  onClose: () => void;
  onUpload: (taskId: number, file: File, note: string) => void;
}

const UploadDeliverableModal: React.FC<UploadDeliverableModalProps> = ({ task, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');

  const handleUpload = () => {
    if (file && task) {
      onUpload(task.id, file, note);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Upload Deliverable for: {task?.title}</h3>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>File</label>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".zip,.rar,.pdf,.doc,.docx,.txt"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Notes</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any notes about this deliverable..."
              rows={4}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary}>Cancel</button>
          <button onClick={handleUpload} className={styles.btnPrimary} disabled={!file}>
            Upload Deliverable
          </button>
        </div>
      </div>
    </div>
  );
};

interface RequestClarificationModalProps {
  task: Task | null;
  onClose: () => void;
  onRequest: (taskId: number, message: string, priority: string) => void;
}

const RequestClarificationModal: React.FC<RequestClarificationModalProps> = ({ task, onClose, onRequest }) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleRequest = () => {
    if (message.trim() && task) {
      onRequest(task.id, message, priority);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Request Clarification: {task?.title}</h3>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Clarification Request</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you need clarification on? Be specific about your questions..."
              rows={6}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary}>Cancel</button>
          <button onClick={handleRequest} className={styles.btnPrimary} disabled={!message.trim()}>
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

interface UpdateStatusModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (taskId: number, status: string, progress: number) => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ task, onClose, onUpdate }) => {
  const [status, setStatus] = useState(task?.status || 'not_started');
  const [progress, setProgress] = useState(task?.progress_percentage || 0);
  const [notes, setNotes] = useState('');

  const handleUpdate = () => {
    if (task) {
      onUpdate(task.id, status, progress);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Update Task Status: {task?.title}</h3>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Progress: {progress}%</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Status Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status update..."
              rows={3}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary}>Cancel</button>
          <button onClick={handleUpdate} className={styles.btnPrimary}>
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};

interface AddCommentModalProps {
  task: Task | null;
  onClose: () => void;
  onComment: (taskId: number, comment: Comment) => void;
}

const AddCommentModal: React.FC<AddCommentModalProps> = ({ task, onClose, onComment }) => {
  const [comment, setComment] = useState('');
  const [isCollaboration, setIsCollaboration] = useState(false);

  const handleSubmit = () => {
    if (comment.trim() && task) {
      onComment(task.id, comment as any);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Add Comment: {task?.title}</h3>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>
              <input 
                type="checkbox" 
                checked={isCollaboration}
                onChange={(e) => setIsCollaboration(e.target.checked)}
              />
              This is a collaboration request
            </label>
          </div>
          <div className={styles.formGroup}>
            <label>Comment</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isCollaboration ? 
                "Ask for help or collaborate with team members..." : 
                "Add a comment about this task..."
              }
              rows={5}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} className={styles.btnPrimary} disabled={!comment.trim()}>
            {isCollaboration ? 'Request Collaboration' : 'Add Comment'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeveloperDashboard: React.FC = () => {
  const { tasks, loading } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [activeFilter, setActiveFilter] = useState('all');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    dispatch(fetchTasks() as any);
  }, [dispatch]);

  // Filter tasks for current developer
  const developerTasks = tasks.filter(task => task.assigned_to === user?.id);
  
  const filteredTasks = developerTasks.filter(task => {
    if (activeFilter === 'all') return true;
    return task.status === activeFilter;
  });

  const stats = {
    total: developerTasks.length,
    completed: developerTasks.filter(task => task.status === 'completed').length,
    inProgress: developerTasks.filter(task => task.status === 'in_progress').length,
    blocked: developerTasks.filter(task => task.status === 'blocked').length,
    notStarted: developerTasks.filter(task => task.status === 'not_started').length,
    overdue: developerTasks.filter(task => 
      task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
    ).length,
  };


  const handleRequestClarification = () => {
    // TODO: Implement clarification request logic
   setActiveModal('clarification');
  };

  const handleUpdateStatus = (taskId: number, status: string, progress: number) => {
    dispatch(updateTaskStatus({
      taskId,
      status: status as TaskStatus,
      progress_percentage: progress
    }) as any);
  };

  const handleAddComment = (taskId: number, comment: Comment) => {
    dispatch(addCommentToTask({
      taskId: taskId,
      comment
    }));
  };

  const handleViewPerformance = () => {
    alert('Performance tracking feature would show metrics and charts here');
  };

  const handleTeamCollaboration = () => {
    alert('Team collaboration feature would show team discussions and chat here');
  };

  // Modal openers
  const openUploadModal = (task: Task) => {
    setSelectedTask(task);
    setActiveModal('upload');
  };

  const openClarificationModal = (task: Task) => {
    setSelectedTask(task);
    setActiveModal('clarification');
  };

  const openStatusModal = (task: Task) => {
    setSelectedTask(task);
    setActiveModal('status');
  };

  const openCommentModal = (task: Task) => {
    setSelectedTask(task);
    setActiveModal('comment');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTask(null);
  };

  if (loading) return <div className={styles.loading}>Loading Employee Dashboard...</div>

  return (
    <div className={styles.developerDashboard}>
      <div className={styles.dashboardHeader}>
        <h1>Employee Dashboard</h1>
        <TextType
          text={["Welcome Employee","Manage your assigned tasks and track your progress"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="|"
        />
      </div>

      {/* Developer Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaTasks />
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

      {/* Developer Features */}
      <div className={styles.developerFeatures}>
        <h2>Quick Actions</h2>
        <div className={styles.featuresGrid}>

          <div className={styles.featureCard}>
            <FaQuestionCircle className={styles.featureIcon} />
            <h3>Request Clarification</h3>
            <p>Ask for clarification or changes from admin on specific tasks</p>
            <button 
              className={styles.featureBtn}
              onClick={() =>handleRequestClarification()}
            >
              Request Help
            </button>
          </div>

          <div className={styles.featureCard}>
            <FaUserFriends className={styles.featureIcon} />
            <h3>Team Collaboration</h3>
            <p>Collaborate with other developers through comments and discussions</p>
            <Link to="https://github.com"><button className={styles.featureBtn}>
              Collaborate
            </button></Link>
          </div>

          <div className={styles.featureCard}>
            <FaChartLine className={styles.featureIcon} />
            <h3>Performance Tracking</h3>
            <p>Track your personal performance and completed tasks</p>
            <button className={styles.featureBtn} onClick={handleViewPerformance}>
              View Performance
            </button>
          </div>
        </div>
      </div>

      {/* Task Management */}
      <div className={styles.taskManagement}>
        <div className={styles.sectionHeader}>
          <h2>My Tasks</h2>
          <div className={styles.filterTabs}>
            <button 
              className={`${styles.filterTab} ${activeFilter === 'all' ? styles.active : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({stats.total})
            </button>
            <button 
              className={`${styles.filterTab} ${activeFilter === 'not_started' ? styles.active : ''}`}
              onClick={() => setActiveFilter('not_started')}
            >
              Not Started ({stats.notStarted})
            </button>
            <button 
              className={`${styles.filterTab} ${activeFilter === 'in_progress' ? styles.active : ''}`}
              onClick={() => setActiveFilter('in_progress')}
            >
              In Progress ({stats.inProgress})
            </button>
            <button 
              className={`${styles.filterTab} ${activeFilter === 'completed' ? styles.active : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed ({stats.completed})
            </button>
          </div>
        </div>

        <div className={styles.tasksList}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task.id} className={`${styles.taskItem} ${styles[task.status]} ${task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' ? styles.overdue : ''}`}>
                <div className={styles.taskMain}>
                  <h4 className={styles.taskTitle}>{task.title}</h4>
                  <p className={styles.taskDescription}>{task.description}</p>
                  <div className={styles.taskMeta}>
                    <span className={styles.taskProject}>Project: {task.project_name || 'Unknown Project'}</span>
                    {task.deadline && (
                      <span className={`${styles.taskDeadline} ${new Date(task.deadline) < new Date() && task.status !== 'completed' ? styles.overdue : ''}`}>
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                    <span className={styles.taskProgress}>Progress: {task.progress_percentage}%</span>
                  </div>
                </div>
                <div className={styles.taskActions}>
                  <span className={`${styles.taskStatus} ${styles[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.btnPrimary} 
                      onClick={() => openStatusModal(task)}
                    >
                      Update Status
                    </button>
                    <button 
                      className={styles.btnSecondary}
                      onClick={() => openCommentModal(task)}
                    >
                      Add Comment
                    </button>
                    <div className={styles.taskQuickActions}>
                      <button 
                        className={styles.btnIcon}
                        onClick={() => openUploadModal(task)}
                        title="Upload Deliverable"
                      >
                        <FaUpload />
                      </button>
                      <button 
                        className={styles.btnIcon}
                        onClick={() => openClarificationModal(task)}
                        title="Request Clarification"
                      >
                        <FaComment />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noTasks}>
              <p>No tasks found for the selected filter.</p>
            </div>
          )}
        </div>
      </div>

      {activeModal === 'clarification' && (
        <RequestClarificationModal 
          task={selectedTask}
          onClose={closeModal}
          onRequest={handleRequestClarification}
        />
      )}

      {activeModal === 'status' && (
        <UpdateStatusModal 
          task={selectedTask}
          onClose={closeModal}
          onUpdate={handleUpdateStatus}
        />
      )}

      {activeModal === 'comment' && (
        <AddCommentModal 
          task={selectedTask}
          onClose={closeModal}
          onComment={handleAddComment}
        />
      )}
    </div>
  );
};

export default DeveloperDashboard;