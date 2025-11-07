import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaFilter, 
  FaChartBar, 
  FaUsers, 
  FaTasks, 
  FaProjectDiagram,
  FaExclamationTriangle,
  FaCalendar,
  FaCheckCircle
} from 'react-icons/fa';
import styles from './ReportingAnalytics.module.css';

interface Project {
  id: number;
  name: string;
  description: string;
  client_company_id: number;
  admin_id: number;
  status: string;
  deadline: string;
  client_company_name?: string;
  created_at: string;
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
  assigned_user_name?: string;
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

const ReportingAnalytics: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [reportType, setReportType] = useState<'overview' | 'projects' | 'team' | 'clients'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects
      const projectsResponse = await fetch('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch tasks
      const tasksResponse = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);

      // Fetch team members (developers and managers)
      const usersResponse = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await usersResponse.json();
      const teamUsers = usersData.filter((user: User) => 
        (user.role === 'developer' || user.role === 'manager') && user.is_active
      );
      setTeamMembers(teamUsers);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Calculate metrics from real data
  const calculateMetrics = () => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(project => project.status === 'completed').length;
    const activeProjects = projects.filter(project => project.status === 'active').length;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' || task.progress_percentage === 100
    ).length;

    // Calculate team productivity based on task completion
    const teamProductivity = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Mock client satisfaction (in real app, this would come from a ratings table)
    const clientSatisfaction = 4.7;

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      teamProductivity,
      clientSatisfaction
    };
  };

  // Get project progress data
  const getProjectProgressData = () => {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.project_id === project.id);
      const completedTasks = projectTasks.filter(task => 
        task.status === 'completed' || task.progress_percentage === 100
      );
      const progress = projectTasks.length > 0 
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0;

      return {
        id: project.id,
        name: project.name,
        progress,
        deadline: project.deadline,
        tasks: projectTasks.length,
        completed: completedTasks.length
      };
    });
  };

  // Get team performance data
  const getTeamPerformanceData = () => {
    return teamMembers.map(member => {
      const memberTasks = tasks.filter(task => task.assigned_to === member.id);
      const completedTasks = memberTasks.filter(task => 
        task.status === 'completed' || task.progress_percentage === 100
      );
      const productivity = memberTasks.length > 0 
        ? Math.round((completedTasks.length / memberTasks.length) * 100)
        : 0;

      return {
        id: member.id,
        name: member.name,
        tasks: memberTasks.length,
        completed: completedTasks.length,
        productivity
      };
    });
  };

  // Filter data by time range
  const filterByTimeRange = (data: any[]) => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return data.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= now;
    });
  };

  const generateReport = () => {
    // In a real app, this would call an API to generate a PDF/Excel report
    const reportData = {
      timeRange,
      reportType,
      metrics: calculateMetrics(),
      projects: getProjectProgressData(),
      team: getTeamPerformanceData(),
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name
    };

    console.log('Generating report with data:', reportData);
    
    // For now, we'll create a downloadable JSON file
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${reportType}-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Report generated successfully!`);
  };

  const metrics = calculateMetrics();
  const projectProgressData = getProjectProgressData();
  const teamPerformanceData = getTeamPerformanceData();

  if (loading) return <div className={styles.loading}>Loading Reports...</div>;

  return (
    <div className={styles['reporting-analytics']}>
      <div className={styles['page-header']}>
        <div className={styles['header-content']}>
          <button className={styles['btn-back']} onClick={onBack}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1>Reporting & Analytics</h1>
          <p>Generate progress reports and view project health overview</p>
        </div>
        <button className={styles['btn-primary']} onClick={generateReport}>
          <FaDownload /> Generate Report
        </button>
      </div>

      {/* Report Controls */}
      <div className={styles['report-controls']}>
        <div className={styles['control-group']}>
          <label>Time Range</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        <div className={styles['control-group']}>
          <label>Report Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as any)}>
            <option value="overview">Overview</option>
            <option value="projects">Projects</option>
            <option value="team">Team Performance</option>
            <option value="clients">Client Reports</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={styles['metrics-grid']}>
        <div className={styles['metric-card']}>
          <div className={styles['metric-icon']}>
            <FaProjectDiagram />
          </div>
          <div className={styles['metric-info']}>
            <h3>{metrics.totalProjects}</h3>
            <p>Total Projects</p>
            <small>{metrics.activeProjects} active</small>
          </div>
        </div>
        <div className={styles['metric-card']}>
          <div className={styles['metric-icon']}>
            <FaTasks />
          </div>
          <div className={styles['metric-info']}>
            <h3>{metrics.totalTasks}</h3>
            <p>Total Tasks</p>
            <small>{metrics.completedTasks} completed</small>
          </div>
        </div>
        <div className={styles['metric-card']}>
          <div className={styles['metric-icon']}>
            <FaChartBar />
          </div>
          <div className={styles['metric-info']}>
            <h3>{metrics.teamProductivity}%</h3>
            <p>Team Productivity</p>
            <small>Based on task completion</small>
          </div>
        </div>
        <div className={styles['metric-card']}>
          <div className={styles['metric-icon']}>
            <FaUsers />
          </div>
          <div className={styles['metric-info']}>
            <h3>{metrics.clientSatisfaction}/5</h3>
            <p>Client Satisfaction</p>
            <small>Average rating</small>
          </div>
        </div>
      </div>

      {/* Charts and Reports */}
      <div className={styles['reports-container']}>
        {reportType === 'overview' && (
          <div className={styles['report-section']}>
            <h2>Project Overview</h2>
            <div className={styles['charts-grid']}>
              <div className={styles['chart-card']}>
                <h3>Project Progress</h3>
                <div className={styles['progress-bars']}>
                  {projectProgressData.slice(0, 5).map(project => (
                    <div key={project.id} className={styles['progress-item']}>
                      <div className={styles['progress-info']}>
                        <span>{project.name}</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className={styles['progress-bar']}>
                        <div 
                          className={`${styles['progress-fill']} ${
                            project.progress < 50 ? styles.low : 
                            project.progress < 80 ? styles.medium : styles.high
                          }`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className={styles['project-meta']}>
                        <span>
                          <FaCheckCircle /> {project.completed}/{project.tasks} tasks
                        </span>
                        {project.deadline && (
                          <span>
                            <FaCalendar /> {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles['chart-card']}>
                <h3>Task Completion</h3>
                <div className={styles['completion-stats']}>
                  <div className={styles['completion-item']}>
                    <span>Completed Tasks</span>
                    <span className={styles['completed-count']}>
                      {metrics.completedTasks}
                    </span>
                  </div>
                  <div className={styles['completion-item']}>
                    <span>In Progress</span>
                    <span className={styles['inprogress-count']}>
                      {metrics.totalTasks - metrics.completedTasks}
                    </span>
                  </div>
                  <div className={styles['completion-item']}>
                    <span>Total Tasks</span>
                    <span className={styles['total-count']}>
                      {metrics.totalTasks}
                    </span>
                  </div>
                  <div className={styles['completion-rate']}>
                    <strong>Completion Rate: </strong>
                    {Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'projects' && (
          <div className={styles['report-section']}>
            <h2>Project Reports</h2>
            <div className={styles['projects-report']}>
              {projectProgressData.map(project => (
                <div key={project.id} className={styles['project-report-card']}>
                  <h3>{project.name}</h3>
                  <div className={styles['project-stats']}>
                    <div className={styles['stat']}>
                      <span>Progress</span>
                      <strong className={
                        project.progress < 50 ? styles.low :
                        project.progress < 80 ? styles.medium : styles.high
                      }>
                        {project.progress}%
                      </strong>
                    </div>
                    <div className={styles['stat']}>
                      <span>Tasks</span>
                      <strong>{project.completed}/{project.tasks}</strong>
                    </div>
                    <div className={styles['stat']}>
                      <span>Completion</span>
                      <strong>
                        {project.tasks > 0 ? Math.round((project.completed / project.tasks) * 100) : 0}%
                      </strong>
                    </div>
                    {project.deadline && (
                      <div className={styles['stat']}>
                        <span>Deadline</span>
                        <strong>{new Date(project.deadline).toLocaleDateString()}</strong>
                      </div>
                    )}
                  </div>
                  {project.deadline && new Date(project.deadline) < new Date() && project.progress < 100 && (
                    <div className={styles['overdue-warning']}>
                      <FaExclamationTriangle /> Project is overdue
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'team' && (
          <div className={styles['report-section']}>
            <h2>Team Performance</h2>
            <div className={styles['team-report']}>
              {teamPerformanceData.map(member => (
                <div key={member.id} className={styles['team-member-card']}>
                  <h3>{member.name}</h3>
                  <div className={styles['member-stats']}>
                    <div className={styles['stat']}>
                      <span>Tasks Assigned</span>
                      <strong>{member.tasks}</strong>
                    </div>
                    <div className={styles['stat']}>
                      <span>Tasks Completed</span>
                      <strong>{member.completed}</strong>
                    </div>
                    <div className={styles['stat']}>
                      <span>Completion Rate</span>
                      <strong className={
                        member.productivity < 70 ? styles.low :
                        member.productivity < 85 ? styles.medium : styles.high
                      }>
                        {member.productivity}%
                      </strong>
                    </div>
                  </div>
                  <div className={styles['productivity-bar']}>
                    <div 
                      className={`${styles['productivity-fill']} ${
                        member.productivity < 70 ? styles.low :
                        member.productivity < 85 ? styles.medium : styles.high
                      }`}
                      style={{ width: `${member.productivity}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'clients' && (
          <div className={styles['report-section']}>
            <h2>Client Reports</h2>
            <div className={styles['clients-report']}>
              <div className={styles['info-message']}>
                <FaChartBar />
                <p>Client reports feature coming soon. This will include client-specific analytics and satisfaction metrics.</p>
              </div>
              <div className={styles['client-stats']}>
                <h3>Current Client Projects</h3>
                {projects.filter(p => p.client_company_name).map(project => (
                  <div key={project.id} className={styles['client-project']}>
                    <span className={styles['client-name']}>
                      {project.client_company_name}
                    </span>
                    <span className={styles['project-name']}>{project.name}</span>
                    <span className={`${styles['status']} ${styles[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingAnalytics;