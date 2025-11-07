import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type{ RootState } from '../../store/store';
import { fetchProjects } from '../../store/slices/projectSlice';
import { fetchTasks } from '../../store/slices/taskSlice';
import { 
  FaTasks, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaEye,
  FaComment,
  FaUpload
} from 'react-icons/fa';
import styles from './DeveloperProjectPage.module.css';

const DeveloperProjectPage: React.FC = () => {
  const { projects, loading } = useSelector((state: RootState) => state.projects);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchProjects() as any);
    dispatch(fetchTasks() as any);
  }, [dispatch]);

  // Get projects where developer has tasks assigned
  const developerProjects = projects.filter(project => 
    tasks.some(task => 
      (task as any).project_id === project.id && task.assigned_to === user?.id
    )
  );

  const getProjectTasks = (projectId: number) => {
    return tasks.filter(task => 
      (task as any).project_id === projectId && task.assigned_to === user?.id
    );
  };

  const getProjectStats = (projectId: number) => {
    const projectTasks = getProjectTasks(projectId);
    return {
      total: projectTasks.length,
      completed: projectTasks.filter(task => task.status === 'completed').length,
      inProgress: projectTasks.filter(task => task.status === 'in_progress').length,
      blocked: projectTasks.filter(task => task.status === 'blocked').length,
      progress: projectTasks.length > 0 
        ? Math.round((projectTasks.filter(task => task.status === 'completed').length / projectTasks.length) * 100)
        : 0
    };
  };

  if (loading) return <div className={styles.loading}>Loading Projects...</div>;

  return (
    <div className={styles.developerProjectPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>My Projects</h1>
          <p>Projects where you have assigned tasks</p>
        </div>
      </div>

      {/* Project Statistics */}
      <div className={styles.projectStatsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaTasks />
          </div>
          <div className={styles.statInfo}>
            <h3>{developerProjects.length}</h3>
            <p>My Projects</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.completed}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>
              {tasks.filter(task => task.assigned_to === user?.id && task.status === 'completed').length}
            </h3>
            <p>Completed Tasks</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.progress}`}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <h3>
              {tasks.filter(task => task.assigned_to === user?.id && task.status === 'in_progress').length}
            </h3>
            <p>In Progress</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blocked}`}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statInfo}>
            <h3>
              {tasks.filter(task => task.assigned_to === user?.id&& task.status === 'blocked').length}
            </h3>
            <p>Blocked Tasks</p>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className={styles.projectsContainer}>
        <h2>Assigned Projects</h2>
        <div className={styles.projectsGrid}>
          {developerProjects.map(project => {
            const stats = getProjectStats(project.id);
            const projectTasks = getProjectTasks(project.id);

            return (
              <div key={project.id} className={styles.projectCard}>
                <div className={styles.projectHeader}>
                  <h3>{project.name}</h3>
                  <span className={`${styles.statusBadge} ${styles[project.status]}`}>
                    {project.status}
                  </span>
                </div>

                <p className={styles.projectDescription}>{project.description}</p>
                <p className={styles.clientCompany}>Client: {project.client_company_name}</p>

                {/* Progress Section */}
                <div className={styles.progressSection}>
                  <div className={styles.progressInfo}>
                    <span>My Progress</span>
                    <span>{stats.progress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${stats.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* My Tasks Overview */}
                <div className={styles.tasksOverview}>
                  <h4>My Tasks in this Project</h4>
                  <div className={styles.tasksList}>
                    {projectTasks.slice(0, 3).map(task => (
                      <div key={task.id} className={`${styles.taskItem} ${styles[task.status]}`}>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <span className={`${styles.taskStatus} ${styles[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                    {projectTasks.length > 3 && (
                      <div className={styles.moreTasks}>
                        +{projectTasks.length - 3} more tasks
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {developerProjects.length === 0 && (
          <div className={styles.noProjects}>
            <p>You don't have any tasks assigned to projects yet.</p>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Project Details</h2>
            {/* Project details content */}
            <button 
              className={styles.btnSecondary}
              onClick={() => setSelectedProject(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperProjectPage;