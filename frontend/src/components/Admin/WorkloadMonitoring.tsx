import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  FaArrowLeft, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock, 
  FaUser,
  FaProjectDiagram,
  FaCalendar
} from 'react-icons/fa';
import styles from './WorkloadMonitoring.module.css';
import { API_URL } from '../../../api';

interface DeveloperWorkload {
  id: number;
  name: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  workloadPercentage: number;
  currentProjects: string[];
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
  created_by: number;
  project_name?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number;
  is_active: boolean;
}

interface Project {
  id: number;
  name: string;
}

const WorkloadMonitoring: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [developers, setDevelopers] = useState<DeveloperWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all developers
      const usersResponse = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData: User[] = await usersResponse.json();
      
      // Filter only active developers
      const developersList = usersData.filter(user => 
        user.role === 'developer' && user.is_active
      );

      // Fetch all tasks
      const tasksResponse = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const tasksData: Task[] = await tasksResponse.json();

      // Fetch projects for project names
      const projectsResponse = await fetch(`${API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const projectsData: Project[] = projectsResponse.ok ? await projectsResponse.json() : [];

      // Calculate workload for each developer
      const workloadData: DeveloperWorkload[] = developersList.map(developer => {
        const developerTasks = tasksData.filter(task => task.assigned_to === developer.id);
        const completedTasks = developerTasks.filter(task => 
          task.status === 'completed' || task.progress_percentage === 100
        );
        const inProgressTasks = developerTasks.filter(task => 
          task.status === 'in_progress' && task.progress_percentage < 100
        );
        const blockedTasks = developerTasks.filter(task => task.status === 'blocked');
        
        // Calculate overdue tasks (deadline passed but not completed)
        const overdueTasks = developerTasks.filter(task => {
          if (task.status === 'completed' || task.progress_percentage === 100) return false;
          if (!task.deadline) return false;
          return new Date(task.deadline) < new Date();
        });

        // Get unique project names
        const projectIds = [...new Set(developerTasks.map(task => task.project_id))];
        const currentProjects = projectIds.map(projectId => {
          const project = projectsData.find(p => p.id === projectId);
          return project?.name || `Project ${projectId}`;
        });

        // Calculate workload percentage based on:
        // - Number of tasks (40% weight)
        // - Overdue tasks (30% weight) 
        // - Blocked tasks (30% weight)
        const baseWorkload = Math.min((developerTasks.length / 10) * 40, 40); // Max 40% for task count
        const overduePenalty = Math.min((overdueTasks.length / 5) * 30, 30); // Max 30% for overdue
        const blockedPenalty = Math.min((blockedTasks.length / 3) * 30, 30); // Max 30% for blocked
        
        const workloadPercentage = Math.min(baseWorkload + overduePenalty + blockedPenalty, 100);

        return {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          totalTasks: developerTasks.length,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          blockedTasks: blockedTasks.length,
          overdueTasks: overdueTasks.length,
          workloadPercentage: Math.round(workloadPercentage),
          currentProjects: currentProjects.slice(0, 3) // Limit to 3 projects for display
        };
      });

      setDevelopers(workloadData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workload data');
      console.error('Error fetching workload data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
  }, [token]);

  const getWorkloadStatus = (percentage: number) => {
    if (percentage >= 90) return 'overloaded';
    if (percentage >= 70) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };

  const getWorkloadIcon = (percentage: number) => {
    const status = getWorkloadStatus(percentage);
    switch (status) {
      case 'overloaded': return <FaExclamationTriangle className={styles['workload-overloaded']} />;
      case 'high': return <FaExclamationTriangle className={styles['workload-high']} />;
      case 'medium': return <FaClock className={styles['workload-medium']} />;
      default: return <FaCheckCircle className={styles['workload-low']} />;
    }
  };

  const handleReassignTasks = (developerId: number) => {
    // In a real app, this would open a task reassignment modal
    console.log('Reassign tasks for developer:', developerId);
    alert(`Task reassignment feature for developer ${developerId} would open here.`);
  };

  const handleViewDetails = (developerId: number) => {
    // In a real app, this would navigate to developer details or open a modal
    console.log('View details for developer:', developerId);
    alert(`Developer details for ${developerId} would open here.`);
  };

  const refreshData = () => {
    fetchWorkloadData();
  };

  if (loading) return <div className={styles['loading']}>Loading Workload Data...</div>;

  if (error) return <div className={styles['error']}>Error: {error}</div>;

  return (
    <div className={styles['workload-monitoring']}>
      <div className={styles['page-header']}>
        <div className={styles['header-content']}>
          <button className={styles['btn-back']} onClick={onBack}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1>Workload Monitoring</h1>
          <p>Monitor workload distribution and prevent developer overload</p>
        </div>
        <button className={styles['btn-secondary']} onClick={refreshData}>
          Refresh Data
        </button>
      </div>

      {/* Workload Overview */}
      <div className={styles['workload-overview']}>
        <div className={styles['overview-stats']}>
          <div className={styles['stat-card']}>
            <div className={styles['stat-value']}>{developers.length}</div>
            <div className={styles['stat-label']}>Total Developers</div>
          </div>
          <div className={styles['stat-card']}>
            <div className={styles['stat-value']}>
              {developers.filter(d => d.workloadPercentage >= 90).length}
            </div>
            <div className={styles['stat-label']}>Overloaded</div>
          </div>
          <div className={styles['stat-card']}>
            <div className={styles['stat-value']}>
              {developers.filter(d => d.workloadPercentage >= 70 && d.workloadPercentage < 90).length}
            </div>
            <div className={styles['stat-label']}>High Workload</div>
          </div>
          <div className={styles['stat-card']}>
            <div className={styles['stat-value']}>
              {developers.reduce((sum, dev) => sum + dev.overdueTasks, 0)}
            </div>
            <div className={styles['stat-label']}>Total Overdue Tasks</div>
          </div>
        </div>

        {/* Workload Distribution Summary */}
        <div className={styles['workload-summary']}>
          <h3>Workload Distribution</h3>
          <div className={styles['summary-grid']}>
            <div className={styles['summary-item']}>
              <span className={`${styles['status-dot']} ${styles['overloaded']}`}></span>
              <span>Overloaded (90-100%): </span>
              <strong>{developers.filter(d => d.workloadPercentage >= 90).length}</strong>
            </div>
            <div className={styles['summary-item']}>
              <span className={`${styles['status-dot']} ${styles['high']}`}></span>
              <span>High (70-89%): </span>
              <strong>{developers.filter(d => d.workloadPercentage >= 70 && d.workloadPercentage < 90).length}</strong>
            </div>
            <div className={styles['summary-item']}>
              <span className={`${styles['status-dot']} ${styles['medium']}`}></span>
              <span>Medium (50-69%): </span>
              <strong>{developers.filter(d => d.workloadPercentage >= 50 && d.workloadPercentage < 70).length}</strong>
            </div>
            <div className={styles['summary-item']}>
              <span className={`${styles['status-dot']} ${styles['low']}`}></span>
              <span>Low (0-49%): </span>
              <strong>{developers.filter(d => d.workloadPercentage < 50).length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Developers Workload List */}
      <div className={styles['developers-list']}>
        {developers.length === 0 && !loading ? (
          <div className={styles['no-data']}>
            <FaUser className={styles['no-data-icon']} />
            <h3>No Developers Found</h3>
            <p>There are no active developers in the system or no tasks assigned.</p>
          </div>
        ) : (
          developers.map(developer => (
            <div key={developer.id} className={`${styles['developer-card']} ${styles[`workload-${getWorkloadStatus(developer.workloadPercentage)}`]}`}>
              <div className={styles['developer-header']}>
                <div className={styles['developer-info']}>
                  <FaUser className={styles['developer-icon']} />
                  <div>
                    <h3>{developer.name}</h3>
                    <p>{developer.email}</p>
                    <small>ID: {developer.id}</small>
                  </div>
                </div>
                <div className={styles['workload-indicator']}>
                  {getWorkloadIcon(developer.workloadPercentage)}
                  <span className={`${styles['workload-percentage']} ${styles[getWorkloadStatus(developer.workloadPercentage)]}`}>
                    {developer.workloadPercentage}%
                  </span>
                </div>
              </div>

              <div className={styles['workload-details']}>
                <div className={styles['task-stats']}>
                  <div className={styles['task-stat']}>
                    <span>Total Tasks</span>
                    <strong>{developer.totalTasks}</strong>
                  </div>
                  <div className={styles['task-stat']}>
                    <span>Completed</span>
                    <strong className={styles['completed']}>{developer.completedTasks}</strong>
                  </div>
                  <div className={styles['task-stat']}>
                    <span>In Progress</span>
                    <strong className={styles['in-progress']}>{developer.inProgressTasks}</strong>
                  </div>
                  <div className={styles['task-stat']}>
                    <span>Blocked</span>
                    <strong className={styles['blocked']}>{developer.blockedTasks}</strong>
                  </div>
                  <div className={styles['task-stat']}>
                    <span>Overdue</span>
                    <strong className={styles['overdue']}>{developer.overdueTasks}</strong>
                  </div>
                </div>

                <div className={styles['workload-progress']}>
                  <div className={styles['progress-info']}>
                    <span>Workload Level</span>
                    <span className={styles[getWorkloadStatus(developer.workloadPercentage)]}>
                      {getWorkloadStatus(developer.workloadPercentage).toUpperCase()}
                    </span>
                  </div>
                  <div className={styles['progress-bar']}>
                    <div 
                      className={`${styles['progress-fill']} ${styles[getWorkloadStatus(developer.workloadPercentage)]}`}
                      style={{ width: `${developer.workloadPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {developer.currentProjects.length > 0 && (
                  <div className={styles['current-projects']}>
                    <strong>
                      <FaProjectDiagram /> Current Projects:
                    </strong>
                    <div className={styles['projects-list']}>
                      {developer.currentProjects.map((project, index) => (
                        <span key={index} className={styles['project-tag']}>
                          {project}
                        </span>
                      ))}
                      {developer.currentProjects.length === 3 && (
                        <span className={styles['more-projects']}>+ more</span>
                      )}
                    </div>
                  </div>
                )}

                {developer.workloadPercentage >= 70 && (
                  <div className={styles['workload-alert']}>
                    <FaExclamationTriangle />
                    <span>
                      {developer.workloadPercentage >= 90 
                        ? 'Developer is overloaded! Consider reassigning tasks.' 
                        : 'High workload detected. Monitor closely.'
                      }
                    </span>
                  </div>
                )}

                {developer.overdueTasks > 0 && (
                  <div className={styles['overdue-alert']}>
                    <FaCalendar />
                    <span>
                      {developer.overdueTasks} overdue task{developer.overdueTasks !== 1 ? 's' : ''} need{developer.overdueTasks !== 1 ? '' : 's'} attention
                    </span>
                  </div>
                )}
              </div>

              <div className={styles['developer-actions']}>
                <button 
                  className={styles['btn-primary']}
                  onClick={() => handleReassignTasks(developer.id)}
                  disabled={developer.totalTasks === 0}
                >
                  Reassign Tasks
                </button>
                <button 
                  className={styles['btn-secondary']}
                  onClick={() => handleViewDetails(developer.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkloadMonitoring;