import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type{ RootState } from '../../store/store';
import { fetchTasks } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import ProjectDefinition from '../Admin/ProjectDefinition';
import ReportingAnalytics from '../Admin/ReportingAnalytics';
import WorkloadMonitoring from '../Admin/WorkloadMonitoring';
import DeadlineManagement from '../Admin/DeadlineManagement';
import { 
  FaTasks, 
  FaProjectDiagram, 
  FaChartLine, 
  FaExclamationTriangle, 
  FaClock,
  FaEye,
  FaUsers
} from 'react-icons/fa';
import styles from './AdminDashboard.module.css';
import TextType from '../../ui/TextType';
import { MdBusiness } from 'react-icons/md';
import UserManagement from '../Admin/UserManagement';
import CompanyManagement from '../Admin/CompanyManagement';

const ManagerDashboard: React.FC = () => {
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const dispatch = useDispatch();

  const [activeView, setActiveView] = useState<
    'dashboard' | 
    'user-management' | 
    'project-definition' | 
    'request-review' | 
    'reporting' | 
    'workload-monitoring' | 
    'deadline-management'|
    'company-management'
  >('dashboard');

  useEffect(() => {
    dispatch(fetchTasks() as any);
    dispatch(fetchProjects() as any);
  }, [dispatch]);

  // Statistics calculations
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'completed').length,
    inProgressTasks: tasks.filter(task => task.status === 'in_progress').length,
    blockedTasks: tasks.filter(task => task.status === 'blocked').length,
    totalProjects: projects.length,
    activeProjects: projects.filter(project => project.status === 'active').length,
    overdueTasks: tasks.filter(task => 
      task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
    ).length,
  };

  const renderCurrentView = () => {
    switch (activeView) {
      case 'project-definition':
        return <ProjectDefinition onBack={() => setActiveView('dashboard')} />;
      case 'reporting':
        return <ReportingAnalytics onBack={() => setActiveView('dashboard')} />;
      case 'workload-monitoring':
        return <WorkloadMonitoring onBack={() => setActiveView('dashboard')} />;
      case 'deadline-management':
        return <DeadlineManagement onBack={() => setActiveView('dashboard')} />;
      case 'user-management':
        return <UserManagement onBack={() => setActiveView('dashboard')} />;
      case 'company-management':
        return <CompanyManagement onBack={() => setActiveView('dashboard')} />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      <div className={styles.dashboardHeader}>
        <h1>Manager Dashboard</h1>
        <TextType
          text={["Welcome Manager","Manage projects and tasks across the platform"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="|"
        />
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaProjectDiagram />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.active}`}>
            <FaChartLine />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.activeProjects}</h3>
            <p>Active Projects</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.tasks}`}>
            <FaTasks />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.overdueTasks}</h3>
            <p>Overdue Tasks</p>
          </div>
        </div>
      </div>

      <div className={styles.adminFeatures}>
        <h2>Manager Controls</h2>
        <div className={styles.featuresGrid}>

          <div className={styles.featureCard}>
            <FaUsers className={styles.featureIcon} />
            <h3>User Management</h3>
            <p>Add, update, suspend, or delete users and manage roles</p>
            <button 
              className={styles.featureBtn}
              onClick={() => setActiveView('user-management')}
            >
              Manage Users
            </button>
          </div>

          <div className={styles.featureCard}>
            <MdBusiness className={styles.featureIcon} />
            <h3>Company Management</h3>
            <p>Add, update, suspend, or delete companies</p>
            <button 
              className={styles.featureBtn}
              onClick={() => setActiveView('company-management')}
            >
              Manage Companies
            </button>
          </div>

          <div className={styles.featureCard}>
            <FaProjectDiagram className={styles.featureIcon} />
            <h3>Project Definition</h3>
            <p>Define project criteria, milestones, and success indicators</p>
            <button 
              className={styles.featureBtn}
              onClick={() => setActiveView('project-definition')}
            >
              Define Projects
            </button>
          </div>

          <div className={styles.featureCard}>
            <FaChartLine className={styles.featureIcon} />
            <h3>Reporting & Analytics</h3>
            <p>Generate progress reports and view project health overview</p>
            <button 
              className={styles.featureBtn}
              onClick={() => setActiveView('reporting')}
            >
              View Reports
            </button>
          </div>

          <div className={styles.featureCard}>
            <FaEye className={styles.featureIcon} />
            <h3>Workload Monitoring</h3>
            <p>Monitor workload distribution and prevent developer overload</p>
            <button 
              className={styles.featureBtn}
              onClick={() => setActiveView('workload-monitoring')}
            >
              Monitor Workload
            </button>
          </div>

          <div className={styles.featureCard}>
            <FaClock className={styles.featureIcon} />
            <h3>Deadline Management</h3>
            <p>Set deadlines and configure automated reminder notifications</p>
            <button 
              className={styles.featureBtn}
              onClick={() => setActiveView('deadline-management')}
            >
              Manage Deadlines
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivity}>
        <div className={styles.activitySection}>
          <h3>Recent Tasks</h3>
          <div className={styles.activityList}>
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className={styles.activityItem}>
                <span className={styles.taskTitle}>{task.title}</span>
                <span className={`${styles.taskStatus} ${styles[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.activitySection}>
          <h3>Active Projects</h3>
          <div className={styles.activityList}>
            {projects.slice(0, 5).map(project => (
              <div key={project.id} className={styles.activityItem}>
                <span className={styles.projectName}>{project.name}</span>
                <span className={styles.projectStatus}>{project.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (tasksLoading || projectsLoading) return <div className={styles.loading}>Loading Manager Dashboard...</div>;

  return (
    <div className={styles.adminDashboard}>
      {renderCurrentView()}
    </div>
  );
};

export default ManagerDashboard;