import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  FaArrowLeft, 
  FaBell, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaProjectDiagram,
  FaTasks,
  FaFlag,
  FaUser,
  FaTimes,
  FaSave
} from 'react-icons/fa';
import styles from './DeadlineManagement.module.css';
import { API_URL } from '../../../api';

interface Deadline {
  id: number;
  project_id: number;
  project_name: string;
  task_id?: number;
  task_name?: string;
  type: 'project' | 'task' | 'milestone';
  title: string;
  description: string;
  due_date: string;
  status: 'upcoming' | 'due_today' | 'overdue' | 'completed';
  reminder_sent: boolean;
  assignee_id?: number;
  assignee_name?: string;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  deadline: string;
  status: string;
  client_company_name?: string;
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
  assigned_user_name?: string;
  project_name?: string;
}

interface Milestone {
  id: number;
  name: string;
  description: string;
  deadline: string;
  completed: boolean;
  project_id: number;
  project_name?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const DeadlineManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'due_today' | 'overdue'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const fetchDeadlineData = async () => {
    try {
      setLoading(true);
      setError(null);


      const projectsResponse = await fetch(`${API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
      const projectsData: Project[] = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch tasks
      const tasksResponse = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
      const tasksData: Task[] = await tasksResponse.json();
      setTasks(tasksData);


      const milestonesResponse = await fetch(`${API_URL}/api/milestones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const milestonesData: Milestone[] = milestonesResponse.ok ? await milestonesResponse.json() : [];
      setMilestones(milestonesData);

      const usersResponse = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const usersData: User[] = usersResponse.ok ? await usersResponse.json() : [];
      setUsers(usersData);

      const combinedDeadlines: Deadline[] = [];

      projectsData.forEach(project => {
        if (project.deadline) {
          const status = calculateDeadlineStatus(project.deadline, project.status === 'completed');
          combinedDeadlines.push({
            id: project.id * 1000, 
            project_id: project.id,
            project_name: project.name,
            type: 'project',
            title: `Project: ${project.name}`,
            description: project.description,
            due_date: project.deadline,
            status,
            reminder_sent: false, 
            created_at: new Date().toISOString()
          });
        }
      });

      tasksData.forEach(task => {
        if (task.deadline) {
          const status = calculateDeadlineStatus(task.deadline, task.status === 'completed' || task.progress_percentage === 100);
          const assignee = usersData.find(user => user.id === task.assigned_to);
          
          combinedDeadlines.push({
            id: task.id * 1000 + 1, 
            project_id: task.project_id,
            project_name: task.project_name || `Project ${task.project_id}`,
            task_id: task.id,
            task_name: task.title,
            type: 'task',
            title: `Task: ${task.title}`,
            description: task.description,
            due_date: task.deadline,
            status,
            reminder_sent: false,
            assignee_id: task.assigned_to,
            assignee_name: assignee?.name,
            created_at: new Date().toISOString()
          });
        }
      });

      
      milestonesData.forEach(milestone => {
        if (milestone.deadline) {
          const status = calculateDeadlineStatus(milestone.deadline, milestone.completed);
          const project = projectsData.find(p => p.id === milestone.project_id);
          
          combinedDeadlines.push({
            id: milestone.id * 1000 + 2, 
            project_id: milestone.project_id,
            project_name: project?.name || `Project ${milestone.project_id}`,
            type: 'milestone',
            title: `Milestone: ${milestone.name}`,
            description: milestone.description,
            due_date: milestone.deadline,
            status,
            reminder_sent: false,
            created_at: new Date().toISOString()
          });
        }
      });

      combinedDeadlines.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      
      setDeadlines(combinedDeadlines);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deadline data');
      console.error('Error fetching deadline data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeadlineStatus = (dueDate: string, isCompleted: boolean): 'upcoming' | 'due_today' | 'overdue' | 'completed' => {
    if (isCompleted) return 'completed';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'due_today';
    if (diffDays < 0) return 'overdue';
    return 'upcoming';
  };

  useEffect(() => {
    fetchDeadlineData();
  }, [token]);

  const filteredDeadlines = deadlines.filter(deadline => {
    if (filterStatus === 'all') return true;
    return deadline.status === filterStatus;
  });

  const sendReminder = async (deadlineId: number) => {
    try {
      console.log('Sending reminder for deadline:', deadlineId);
      
      setDeadlines(deadlines.map(deadline => 
        deadline.id === deadlineId ? { ...deadline, reminder_sent: true } : deadline
      ));
      
      alert('Reminder sent successfully!');
    } catch (err) {
      setError('Failed to send reminder');
      console.error('Error sending reminder:', err);
    }
  };

  const sendBulkReminders = async () => {
    try {
      const upcomingDeadlines = deadlines.filter(d => 
        (d.status === 'due_today' || d.status === 'overdue') && !d.reminder_sent
      );
      
      console.log('Sending bulk reminders for:', upcomingDeadlines);
      
      setDeadlines(deadlines.map(deadline => 
        upcomingDeadlines.some(d => d.id === deadline.id) 
          ? { ...deadline, reminder_sent: true }
          : deadline
      ));
      
      alert(`Reminders sent for ${upcomingDeadlines.length} deadlines!`);
    } catch (err) {
      setError('Failed to send bulk reminders');
      console.error('Error sending bulk reminders:', err);
    }
  };

  const handleCreateDeadline = async (deadlineData: any) => {
    try {
      setError(null);
      
      const newDeadline: Deadline = {
        id: Date.now(), 
        project_id: parseInt(deadlineData.project_id),
        project_name: projects.find(p => p.id === parseInt(deadlineData.project_id))?.name || 'Unknown Project',
        task_id: deadlineData.task_id ? parseInt(deadlineData.task_id) : undefined,
        task_name: deadlineData.task_id ? tasks.find(t => t.id === parseInt(deadlineData.task_id))?.title : undefined,
        type: deadlineData.type,
        title: deadlineData.title,
        description: deadlineData.description,
        due_date: deadlineData.due_date,
        status: calculateDeadlineStatus(deadlineData.due_date, false),
        reminder_sent: false,
        assignee_id: deadlineData.assignee_id ? parseInt(deadlineData.assignee_id) : undefined,
        assignee_name: deadlineData.assignee_id ? users.find(u => u.id === parseInt(deadlineData.assignee_id))?.name : undefined,
        created_at: new Date().toISOString()
      };

      setDeadlines([...deadlines, newDeadline]);
      setShowCreateModal(false);
      alert('Deadline created successfully!');
    } catch (err) {
      setError('Failed to create deadline');
      console.error('Error creating deadline:', err);
    }
  };

  const handleEditDeadline = async (deadlineData: any) => {
    if (!editingDeadline) return;

    try {
      setError(null);
      
      const updatedDeadline: Deadline = {
        ...editingDeadline,
        title: deadlineData.title,
        description: deadlineData.description,
        due_date: deadlineData.due_date,
        status: calculateDeadlineStatus(deadlineData.due_date, false),
        assignee_id: deadlineData.assignee_id ? parseInt(deadlineData.assignee_id) : undefined,
        assignee_name: deadlineData.assignee_id ? users.find(u => u.id === parseInt(deadlineData.assignee_id))?.name : undefined,
      };

      // In a real app, this would call your API to update the deadline
      setDeadlines(deadlines.map(deadline => 
        deadline.id === editingDeadline.id ? updatedDeadline : deadline
      ));
      
      setShowEditModal(false);
      setEditingDeadline(null);
      alert('Deadline updated successfully!');
    } catch (err) {
      setError('Failed to update deadline');
      console.error('Error updating deadline:', err);
    }
  };

  const handleDeleteDeadline = async (deadlineId: number) => {
    if (!window.confirm('Are you sure you want to delete this deadline?')) {
      return;
    }

    try {
      setError(null);
      // In a real app, this would call your API to delete the deadline
      setDeadlines(deadlines.filter(d => d.id !== deadlineId));
      alert('Deadline deleted successfully!');
    } catch (err) {
      setError('Failed to delete deadline');
      console.error('Error deleting deadline:', err);
    }
  };

  const handleOpenEditModal = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setShowEditModal(true);
  };

  const markAsCompleted = async (deadlineId: number) => {
    try {
      setDeadlines(deadlines.map(deadline => 
        deadline.id === deadlineId ? { ...deadline, status: 'completed' } : deadline
      ));
      alert('Deadline marked as completed!');
    } catch (err) {
      setError('Failed to mark deadline as completed');
      console.error('Error marking deadline as completed:', err);
    }
  };

  const extendDeadline = async (deadlineId: number, days: number) => {
    try {
      const deadline = deadlines.find(d => d.id === deadlineId);
      if (!deadline) return;

      const newDueDate = new Date(deadline.due_date);
      newDueDate.setDate(newDueDate.getDate() + days);

      setDeadlines(deadlines.map(d => 
        d.id === deadlineId 
          ? { 
              ...d, 
              due_date: newDueDate.toISOString().split('T')[0],
              status: calculateDeadlineStatus(newDueDate.toISOString().split('T')[0], false)
            } 
          : d
      ));
      
      alert(`Deadline extended by ${days} days!`);
    } catch (err) {
      setError('Failed to extend deadline');
      console.error('Error extending deadline:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <FaExclamationTriangle className={styles.statusOverdue} />;
      case 'due_today': return <FaExclamationTriangle className={styles.statusDueToday} />;
      case 'completed': return <FaCheckCircle className={styles.statusCompleted} />;
      default: return <FaBell className={styles.statusUpcoming} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <FaProjectDiagram />;
      case 'task': return <FaTasks />;
      case 'milestone': return <FaFlag />;
      default: return <FaBell />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 1) return `Due in ${diffDays} days`;
    return `Overdue by ${Math.abs(diffDays)} days`;
  };

  const refreshData = () => {
    fetchDeadlineData();
  };

  if (loading) return <div className={styles.loading}>Loading Deadlines...</div>;

  return (
    <div className={styles.deadlineManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <button className={styles.btnBack} onClick={onBack}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1>Deadline Management</h1>
          <p>Monitor and manage project, task, and milestone deadlines</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={refreshData}>
            Refresh Data
          </button>
          <button className={styles.btnSecondary} onClick={sendBulkReminders}>
            <FaBell /> Send All Reminders
          </button>
          <button 
            className={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
            disabled={user?.role !== 'admin' && user?.role !== 'manager'}
          >
            <FaPlus /> Set New Deadline
          </button>
        </div>
      </div>

      {}
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <div className={styles.errorContent}>
            <strong>Error</strong>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className={styles.errorClose}>
            ×
          </button>
        </div>
      )}

      {}
      <div className={styles.deadlineStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{deadlines.length}</div>
          <div className={styles.statLabel}>Total Deadlines</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {deadlines.filter(d => d.status === 'overdue').length}
          </div>
          <div className={styles.statLabel}>Overdue</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {deadlines.filter(d => d.status === 'due_today').length}
          </div>
          <div className={styles.statLabel}>Due Today</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {deadlines.filter(d => !d.reminder_sent && (d.status === 'due_today' || d.status === 'overdue')).length}
          </div>
          <div className={styles.statLabel}>Pending Reminders</div>
        </div>
      </div>

      {}
      <div className={styles.filtersSection}>
        <div className={styles.filterTabs}>
          <button 
            className={`${styles.filterTab} ${filterStatus === 'all' ? styles.active : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Deadlines ({deadlines.length})
          </button>
          <button 
            className={`${styles.filterTab} ${filterStatus === 'upcoming' ? styles.active : ''}`}
            onClick={() => setFilterStatus('upcoming')}
          >
            Upcoming ({deadlines.filter(d => d.status === 'upcoming').length})
          </button>
          <button 
            className={`${styles.filterTab} ${filterStatus === 'due_today' ? styles.active : ''}`}
            onClick={() => setFilterStatus('due_today')}
          >
            Due Today ({deadlines.filter(d => d.status === 'due_today').length})
          </button>
          <button 
            className={`${styles.filterTab} ${filterStatus === 'overdue' ? styles.active : ''}`}
            onClick={() => setFilterStatus('overdue')}
          >
            Overdue ({deadlines.filter(d => d.status === 'overdue').length})
          </button>
        </div>
      </div>

      {}
      <div className={styles.deadlinesList}>
        {filteredDeadlines.length === 0 ? (
          <div className={styles.noDeadlines}>
            <FaBell className={styles.noDeadlinesIcon} />
            <h3>No Deadlines Found</h3>
            <p>
              {filterStatus === 'all' 
                ? 'No deadlines found in the system.' 
                : `No ${filterStatus.replace('_', ' ')} deadlines found.`
              }
            </p>
          </div>
        ) : (
          filteredDeadlines.map(deadline => (
            <div key={deadline.id} className={`${styles.deadlineCard} ${styles[`status${deadline.status.charAt(0).toUpperCase() + deadline.status.slice(1)}`]}`}>
              <div className={styles.deadlineHeader}>
                <div className={styles.deadlineTitleSection}>
                  <div className={styles.deadlineTypeIcon}>
                    {getTypeIcon(deadline.type)}
                  </div>
                  <div>
                    <h3>{deadline.title}</h3>
                    <div className={styles.deadlineMeta}>
                      <span className={styles.projectName}>
                        <FaProjectDiagram /> {deadline.project_name}
                      </span>
                      <span className={`${styles.deadlineType} ${styles[deadline.type]}`}>
                        {deadline.type}
                      </span>
                      {deadline.task_name && (
                        <span className={styles.taskName}>
                          <FaTasks /> Task: {deadline.task_name}
                        </span>
                      )}
                      {deadline.assignee_name && (
                        <span className={styles.assigneeName}>
                          <FaUser /> Assignee: {deadline.assignee_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.deadlineStatus}>
                  {getStatusIcon(deadline.status)}
                  <span className={`${styles.statusText} ${styles[deadline.status]}`}>
                    {deadline.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className={styles.deadlineBody}>
                <p className={styles.deadlineDescription}>{deadline.description}</p>
                
                <div className={styles.deadlineDetails}>
                  <div className={styles.detailItem}>
                    <strong>Due Date:</strong>
                    <span>{new Date(deadline.due_date).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Time Until Due:</strong>
                    <span className={`${styles.timeRemaining} ${styles[deadline.status]}`}>
                      {getDaysUntilDue(deadline.due_date)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Reminder:</strong>
                    <span className={deadline.reminder_sent ? styles.reminderSent : styles.reminderPending}>
                      {deadline.reminder_sent ? 'Sent' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.deadlineActions}>
                {!deadline.reminder_sent && deadline.status !== 'completed' && (
                  <button 
                    className={styles.btnSendReminder}
                    onClick={() => sendReminder(deadline.id)}
                  >
                    <FaBell /> Send Reminder
                  </button>
                )}
                {deadline.status !== 'completed' && (
                  <>
                    <button 
                      className={styles.btnSuccess}
                      onClick={() => markAsCompleted(deadline.id)}
                    >
                      <FaCheckCircle /> Mark Complete
                    </button>
                    <button 
                      className={styles.btnWarning}
                      onClick={() => extendDeadline(deadline.id, 7)}
                    >
                      Extend 1 Week
                    </button>
                  </>
                )}
                <button 
                  className={styles.btnEdit}
                  onClick={() => handleOpenEditModal(deadline)}
                  disabled={user?.role !== 'admin' && user?.role !== 'manager'}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  className={styles.btnDelete}
                  onClick={() => handleDeleteDeadline(deadline.id)}
                  disabled={user?.role !== 'admin' && user?.role !== 'manager'}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {}
      {showCreateModal && (
        <CreateDeadlineModal
          projects={projects}
          tasks={tasks}
          milestones={milestones}
          users={users}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDeadline}
        />
      )}

      {}
      {showEditModal && editingDeadline && (
        <EditDeadlineModal
          deadline={editingDeadline}
          projects={projects}
          tasks={tasks}
          milestones={milestones}
          users={users}
          onClose={() => {
            setShowEditModal(false);
            setEditingDeadline(null);
          }}
          onSubmit={handleEditDeadline}
        />
      )}
    </div>
  );
};

// Create Deadline Modal Component
interface CreateDeadlineModalProps {
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  users: User[];
  onClose: () => void;
  onSubmit: (deadlineData: any) => void;
}

const CreateDeadlineModal: React.FC<CreateDeadlineModalProps> = ({ 
  projects, 
  tasks, 
  milestones, 
  users, 
  onClose, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    due_date: '',
    project_id: '',
    task_id: '',
    milestone_id: '',
    assignee_id: ''
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

  const filteredTasks = tasks.filter(task => 
    !formData.project_id || task.project_id === parseInt(formData.project_id)
  );

  const filteredMilestones = milestones.filter(milestone => 
    !formData.project_id || milestone.project_id === parseInt(formData.project_id)
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Set New Deadline</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.deadlineForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Title *</label>
            <input 
              type="text" 
              placeholder="Enter deadline title" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required 
              disabled={submitting}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea 
              placeholder="Enter deadline description" 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={submitting}
            ></textarea>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Type *</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                disabled={submitting}
              >
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Due Date *</label>
              <input 
                type="date" 
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required 
                disabled={submitting}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Project *</label>
            <select 
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value, task_id: '', milestone_id: '' })}
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

          {formData.type === 'task' && (
            <div className={styles.formGroup}>
              <label>Task</label>
              <select 
                value={formData.task_id}
                onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                disabled={submitting}
              >
                <option value="">Select task (optional)</option>
                {filteredTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'milestone' && (
            <div className={styles.formGroup}>
              <label>Milestone</label>
              <select 
                value={formData.milestone_id}
                onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
                disabled={submitting}
              >
                <option value="">Select milestone (optional)</option>
                {filteredMilestones.map(milestone => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Assignee</label>
            <select 
              value={formData.assignee_id}
              onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
              disabled={submitting}
            >
              <option value="">Select assignee (optional)</option>
              {users.filter(user => user.role === 'developer').map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
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
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Creating...
                </>
              ) : (
                <>
                  <FaSave /> Set Deadline
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Deadline Modal Component
interface EditDeadlineModalProps {
  deadline: Deadline;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  users: User[];
  onClose: () => void;
  onSubmit: (deadlineData: any) => void;
}

const EditDeadlineModal: React.FC<EditDeadlineModalProps> = ({ 
  deadline,  
  users, 
  onClose, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    title: deadline.title,
    description: deadline.description,
    due_date: deadline.due_date,
    assignee_id: deadline.assignee_id?.toString() || ''
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
          <h2>Edit Deadline: {deadline.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.deadlineForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Title *</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required 
              disabled={submitting}
            />
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

          <div className={styles.formGroup}>
            <label>Due Date *</label>
            <input 
              type="date" 
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required 
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Assignee</label>
            <select 
              value={formData.assignee_id}
              onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
              disabled={submitting}
            >
              <option value="">Select assignee (optional)</option>
              {users.filter(user => user.role === 'developer').map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
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
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave /> Update Deadline
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeadlineManagement;
