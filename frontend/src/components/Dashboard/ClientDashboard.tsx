import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { fetchProjects } from '../../store/slices/projectSlice';
import { fetchTasks } from '../../store/slices/taskSlice';
import { 
  FaProjectDiagram, 
  FaChartLine, 
  FaClock, 
  FaCheckCircle,
  FaBell,
  FaStar,
  FaRegStar,
  FaTimes
} from 'react-icons/fa';
import styles from './ClientDashboard.module.css';

// Import ratings slice actions and selectors
import { 
  addProjectRating, 
  fetchRatingsDashboard, 
  selectRatingsDashboard,
  selectUserProjectRating,
  selectRatingsLoading,
  selectRatingsError,
  clearRatingsError
} from '../../store/slices/ratingsSlice';

// Define proper types based on your slices
interface ProjectWithStats {
  id: number;
  name: string;
  description: string;
  status: string;
  deadline: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  client_company_name?: string;
}

const ClientDashboard: React.FC = () => {
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Ratings state
  const ratingsDashboard = useSelector(selectRatingsDashboard);
  const ratingsLoading = useSelector(selectRatingsLoading);
  const ratingsError = useSelector(selectRatingsError);
  
  const dispatch = useDispatch();

  // Modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null);

  useEffect(() => {
    dispatch(fetchProjects() as any);
    dispatch(fetchTasks() as any);
    dispatch(fetchRatingsDashboard() as any);
  }, [dispatch]);

  // Clear errors when modal closes
  useEffect(() => {
    if (ratingsError.project) {
      dispatch(clearRatingsError('project'));
    }
  }, [isRatingModalOpen, dispatch, ratingsError.project]);

  // Filter tasks for client's projects with proper typing
  const clientTasks = tasks.filter(task => 
    projects.some(project => project.id === task.project_id)
  );

  // Calculate project statistics with proper typing
  const projectStats: ProjectWithStats[] = projects.map(project => {
    const projectTasks = clientTasks.filter(task => task.project_id === project.id);
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      deadline: project.deadline,
      progress,
      totalTasks,
      completedTasks,
      overdueTasks: projectTasks.filter(task => 
        task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
      ).length,
      client_company_name: project.client_company_name,
    };
  });

  const loading = projectsLoading || tasksLoading || ratingsLoading.dashboard;

  // Calculate statistics safely
  const totalCompletedTasks = clientTasks.filter(task => task.status === 'completed').length;
  const totalPendingTasks = clientTasks.filter(task => task.status !== 'completed').length;
  const averageProgress = projectStats.length > 0 
    ? Math.round(projectStats.reduce((acc, curr) => acc + curr.progress, 0) / projectStats.length)
    : 0;

  // Calculate task status distribution for charts
  const taskStatusData = {
    completed: clientTasks.filter(task => String(task.status) === 'completed').length,
    inProgress: clientTasks.filter(task => String(task.status) === 'in_progress').length,
    pending: clientTasks.filter(task => String(task.status) === 'pending').length,
    overdue: clientTasks.filter(task => 
      task.deadline && new Date(task.deadline) < new Date() && String(task.status) !== 'completed'
    ).length
  };

  // Calculate project status distribution
  const projectStatusData = {
    active: projects.filter(project => project.status === 'active').length,
    completed: projects.filter(project => project.status === 'completed').length,
    onHold: projects.filter(project => project.status === 'on_hold').length
  };

  // Quick Actions
  const handleRequestUpdate = (projectId: number) => {
    console.log('Requesting update for project:', projectId);
    alert('Update request has been sent to the project team.');
  };

  const handleGenerateProgressReport = (projectId: number) => {
    console.log('Generating progress report for project:', projectId);
    const project = projects.find(p => p.id === projectId);
    alert(`Progress report for "${project?.name}" is being generated and will be available for download shortly.`);
  };

  // Rating Handlers
  const handleRateProject = async (projectId: number, rating: number, comment: string, wouldRecommend: boolean) => {
    try {
      await dispatch(addProjectRating({
        projectId,
        ratingData: {
          rating,
          comment: comment || undefined,
          would_recommend: wouldRecommend
        }
      }) as any).unwrap();
      
      // Refresh the ratings dashboard after adding a new rating
      dispatch(fetchRatingsDashboard() as any);
      
      alert(`Thank you for your ${rating}-star rating! Your feedback has been recorded.`);
      setIsRatingModalOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  // Open rating modal
  const openRatingModal = (project?: ProjectWithStats) => {
    setSelectedProject(project || null);
    setIsRatingModalOpen(true);
  };

  // Close rating modal
  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
    setSelectedProject(null);
  };

  if (loading) return <div className={styles.loading}>Loading Client Dashboard...</div>;

  return (
    <div className={styles.clientDashboard}>
      <div className={styles.dashboardHeader}>
        <h1>Client Dashboard</h1>
        <p>Welcome Client - Track your project progress</p>
      </div>

      {/* Client Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <FaProjectDiagram />
          </div>
          <div className={styles.statInfo}>
            <h3>{projects.length}</h3>
            <p>Active Projects</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.progress}`}>
            <FaChartLine />
          </div>
          <div className={styles.statInfo}>
            <h3>{averageProgress}%</h3>
            <p>Average Progress</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.completed}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>{totalCompletedTasks}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.pending}`}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <h3>{totalPendingTasks}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>
      </div>

      {/* Progress Charts Section */}
      <div className={styles.chartsSection}>
        <h2>Progress Analytics</h2>
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Task Status Distribution</h3>
            <TaskStatusChart data={taskStatusData} />
          </div>
          
          <div className={styles.chartCard}>
            <h3>Project Status Overview</h3>
            <ProjectStatusChart data={projectStatusData} />
          </div>
          
          <div className={styles.chartCard}>
            <h3>Project Progress Timeline</h3>
            <ProgressTimelineChart projects={projectStats} />
          </div>
        </div>
      </div>

      {/* Client Features - Replaced Generate Reports with Ratings & Feedback */}
      <div className={styles.clientFeatures}>
        <h2>Project Controls</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <FaBell className={styles.featureIcon} />
            <h3>Request Updates</h3>
            <p>Request status updates and progress reports from the team</p>
            <button 
              className={styles.featureBtn}
              onClick={() => projects.length > 0 && handleRequestUpdate(projects[0].id)}
            >
              Request Update
            </button>
          </div>

          <div className={styles.featureCard}>
            <FaStar className={styles.featureIcon} />
            <h3>Ratings & Feedback</h3>
            <p>Provide ratings and feedback for your projects</p>
            <button 
              className={styles.featureBtn}
              onClick={() => openRatingModal()}
            >
              Rate Projects
            </button>
          </div>
        </div>
      </div>

      {/* Project Progress */}
      <div className={styles.projectProgress}>
        <h2>Project Progress</h2>
        <div className={styles.projectsList}>
          {projectStats.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project}
              onRequestUpdate={handleRequestUpdate}
              onGenerateReport={handleGenerateProgressReport}
              onRateProject={() => openRatingModal(project)}
              userId={user?.id}
            />
          ))}
        </div>
      </div>

      {/* Progress Reports Section */}
      <div className={styles.progressReports}>
        <h2>Available Progress Reports</h2>
        <div className={styles.reportsList}>
          {projectStats.slice(0, 3).map(project => (
            <div key={project.id} className={styles.reportItem}>
              <div className={styles.reportInfo}>
                <h4>{project.name}</h4>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <div className={styles.reportStats}>
                  <span className={styles.reportStat}>
                    <strong>Progress:</strong> {project.progress}%
                  </span>
                  <span className={styles.reportStat}>
                    <strong>Tasks:</strong> {project.completedTasks}/{project.totalTasks} completed
                  </span>
                  <span className={styles.reportStat}>
                    <strong>Status:</strong> <span className={styles[project.status]}>{project.status || 'inactive'}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {projectStats.length === 0 && (
          <div className={styles.noReports}>
            <p>No progress reports available yet.</p>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {isRatingModalOpen && (
        <RatingModal
          projects={projectStats.filter(project => project.progress > 50)}
          selectedProject={selectedProject}
          onRateProject={handleRateProject}
          onClose={closeRatingModal}
          ratingsDashboard={ratingsDashboard}
          ratingsLoading={ratingsLoading}
          ratingsError={ratingsError}
          userId={user?.id}
        />
      )}
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: ProjectWithStats;
  onRequestUpdate: (projectId: number) => void;
  onGenerateReport: (projectId: number) => void;
  onRateProject: (project: ProjectWithStats) => void;
  userId?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onRequestUpdate,
  onRateProject,
  userId
}) => {
  // Check if user has already rated this project
  const userRating = useSelector((state: RootState) => 
    selectUserProjectRating(state, project.id, userId || 0)
  );

  const hasRated = !!userRating;

  return (
    <div className={styles.projectCard}>
      <div className={styles.projectHeader}>
        <h3>{project.name}</h3>
        <span className={`${styles.projectStatus} ${styles[project.status]}`}>
          {project.status}
        </span>
        {hasRated && (
          <span className={styles.ratedBadge}>
            <FaStar /> Rated
          </span>
        )}
      </div>
      
      <p className={styles.projectDescription}>{project.description}</p>
      
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>Overall Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      <div className={styles.projectStats}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{project.totalTasks}</span>
          <span className={styles.statLabel}>Total Tasks</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{project.completedTasks}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{project.overdueTasks}</span>
          <span className={styles.statLabel}>Overdue</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{Math.round(project.progress)}%</span>
          <span className={styles.statLabel}>Progress</span>
        </div>
      </div>

      {project.deadline && (
        <div className={styles.projectDeadline}>
          <FaClock className={styles.deadlineIcon} />
          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
        </div>
      )}

      {/* Project-specific actions */}
      <div className={styles.projectActions}>
        <button 
          className={styles.projectActionBtn}
          onClick={() => onRequestUpdate(project.id)}
        >
          <FaBell /> Request Update
        </button>
        {project.progress > 50 && (
          <button 
            className={styles.projectActionBtn}
            onClick={() => onRateProject(project)}
            disabled={hasRated}
          >
            <FaStar /> {hasRated ? 'Already Rated' : 'Rate Project'}
          </button>
        )}
      </div>
    </div>
  );
};

// Rating Modal Component
interface RatingModalProps {
  projects: ProjectWithStats[];
  selectedProject: ProjectWithStats | null;
  onRateProject: (projectId: number, rating: number, comment: string, wouldRecommend: boolean) => void;
  onClose: () => void;
  ratingsDashboard: any;
  ratingsLoading: any;
  ratingsError: any;
  userId?: number;
}

const RatingModal: React.FC<RatingModalProps> = ({
  projects,
  selectedProject,
  onRateProject,
  onClose,
  ratingsDashboard,
  ratingsLoading,
  ratingsError,
  userId
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(
    selectedProject?.id || ''
  );
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'rate' | 'view'>('rate');

  const currentProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : selectedProject;

  const handleSubmitRating = () => {
    if (!currentProject) {
      alert('Please select a project to rate');
      return;
    }
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    onRateProject(currentProject.id, rating, comment, wouldRecommend || false);
    // Reset form
    setRating(0);
    setComment('');
    setWouldRecommend(null);
  };

  const handleProjectChange = (projectId: number) => {
    setSelectedProjectId(projectId);
    // Reset form when project changes
    setRating(0);
    setComment('');
    setWouldRecommend(null);
  };

  // Get user's ratings from Redux store
  const userRatings = ratingsDashboard.recent_project_ratings.filter(
    (rating: any) => userId && rating.user_id === userId
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.ratingModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Project Ratings & Feedback</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalTabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'rate' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('rate')}
          >
            Rate Projects
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'view' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('view')}
          >
            Your Ratings ({userRatings.length})
          </button>
        </div>

        <div className={styles.modalContent}>
          {activeTab === 'rate' ? (
            <div className={styles.rateTab}>
              {/* Error Display */}
              {ratingsError.project && (
                <div className={styles.errorMessage}>
                  <p>Error: {ratingsError.project}</p>
                </div>
              )}

              <div className={styles.projectSelection}>
                <label htmlFor="project-select">Select Project to Rate:</label>
                <select 
                  id="project-select"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(Number(e.target.value))}
                >
                  <option value="">Choose a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.progress}% complete)
                    </option>
                  ))}
                </select>
              </div>

              {currentProject && (
                <div className={styles.ratingForm}>
                  <div className={styles.projectInfo}>
                    <h3>{currentProject.name}</h3>
                    <p>{currentProject.description}</p>
                    <div className={styles.projectProgress}>
                      <span>Progress: {currentProject.progress}%</span>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ width: `${currentProject.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.ratingSection}>
                    <div className={styles.ratingStars}>
                      <p>How would you rate this project?</p>
                      <div className={styles.starsInput}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={styles.starBtn}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                          >
                            {(hoverRating || rating) >= star ? (
                              <FaStar className={styles.filledStar} />
                            ) : (
                              <FaRegStar className={styles.emptyStar} />
                            )}
                          </button>
                        ))}
                      </div>
                      <span className={styles.ratingText}>
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                        {!rating && 'Select a rating'}
                      </span>
                    </div>

                    <div className={styles.recommendation}>
                      <p>Would you recommend this team?</p>
                      <div className={styles.recommendOptions}>
                        <button
                          type="button"
                          className={`${styles.recommendBtn} ${wouldRecommend === true ? styles.active : ''}`}
                          onClick={() => setWouldRecommend(true)}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className={`${styles.recommendBtn} ${wouldRecommend === false ? styles.active : ''}`}
                          onClick={() => setWouldRecommend(false)}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <div className={styles.commentSection}>
                      <label htmlFor="comment">Additional Comments (Optional)</label>
                      <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this project..."
                        rows={4}
                      />
                    </div>

                    <div className={styles.ratingActions}>
                      <button 
                        className={styles.submitRatingBtn}
                        onClick={handleSubmitRating}
                        disabled={ratingsLoading.project}
                      >
                        {ratingsLoading.project ? 'Submitting...' : 'Submit Rating'}
                      </button>
                      <button 
                        className={styles.cancelRatingBtn}
                        onClick={() => {
                          setRating(0);
                          setComment('');
                          setWouldRecommend(null);
                        }}
                        disabled={ratingsLoading.project}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!currentProject && projects.length === 0 && (
                <div className={styles.noProjects}>
                  <p>No projects available for rating yet. Projects become rateable after 50% completion.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.viewTab}>
              <h3>Your Previous Ratings</h3>
              
              {ratingsLoading.dashboard ? (
                <div className={styles.loading}>Loading your ratings...</div>
              ) : (
                <>
                  <div className={styles.ratingsList}>
                    {userRatings.map((ratingItem: any) => (
                      <div key={ratingItem.id} className={styles.ratingItem}>
                        <div className={styles.ratingHeader}>
                          <h4>{ratingItem.project_name || `Project ${ratingItem.project_id}`}</h4>
                          <span className={styles.ratingDate}>
                            {new Date(ratingItem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.ratingDisplay}>
                          <div className={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar 
                                key={star} 
                                className={star <= ratingItem.rating ? styles.filledStar : styles.emptyStar} 
                              />
                            ))}
                          </div>
                          <span className={styles.ratingValue}>{ratingItem.rating}/5</span>
                        </div>
                        {ratingItem.comment && (
                          <p className={styles.ratingComment}>"{ratingItem.comment}"</p>
                        )}
                        <div className={styles.recommendationDisplay}>
                          <span className={`${styles.recommendation} ${ratingItem.would_recommend ? styles.recommended : styles.notRecommended}`}>
                            {ratingItem.would_recommend ? '✓ Would recommend' : '✗ Would not recommend'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {userRatings.length === 0 && (
                    <div className={styles.noRatings}>
                      <p>You haven't rated any projects yet.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Task Status Chart Component
interface TaskStatusChartProps {
  data: {
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
  };
}

const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ data }) => {
  const totalTasks = data.completed + data.inProgress + data.pending + data.overdue;
  
  if (totalTasks === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.noData}>No tasks available</div>
      </div>
    );
  }

  const percentages = {
    completed: (data.completed / totalTasks) * 100,
    inProgress: (data.inProgress / totalTasks) * 100,
    pending: (data.pending / totalTasks) * 100,
    overdue: (data.overdue / totalTasks) * 100
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.barChart}>
        <div className={styles.barChartItem}>
          <div className={styles.barLabel}>Completed</div>
          <div className={styles.barTrack}>
            <div 
              className={`${styles.barFill} ${styles.completed}`}
              style={{ width: `${percentages.completed}%` }}
            ></div>
          </div>
          <div className={styles.barValue}>{data.completed}</div>
        </div>
        
        <div className={styles.barChartItem}>
          <div className={styles.barLabel}>In Progress</div>
          <div className={styles.barTrack}>
            <div 
              className={`${styles.barFill} ${styles.inProgress}`}
              style={{ width: `${percentages.inProgress}%` }}
            ></div>
          </div>
          <div className={styles.barValue}>{data.inProgress}</div>
        </div>
        
        <div className={styles.barChartItem}>
          <div className={styles.barLabel}>Pending</div>
          <div className={styles.barTrack}>
            <div 
              className={`${styles.barFill} ${styles.pending}`}
              style={{ width: `${percentages.pending}%` }}
            ></div>
          </div>
          <div className={styles.barValue}>{data.pending}</div>
        </div>
        
        <div className={styles.barChartItem}>
          <div className={styles.barLabel}>Overdue</div>
          <div className={styles.barTrack}>
            <div 
              className={`${styles.barFill} ${styles.overdue}`}
              style={{ width: `${percentages.overdue}%` }}
            ></div>
          </div>
          <div className={styles.barValue}>{data.overdue}</div>
        </div>
      </div>
    </div>
  );
};

// Project Status Chart Component
interface ProjectStatusChartProps {
  data: {
    active: number;
    completed: number;
    onHold: number;
  };
}

const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({ data }) => {
  const totalProjects = data.active + data.completed + data.onHold;
  
  if (totalProjects === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.noData}>No projects available</div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.donutChart}>
        <div className={styles.donutSegment} style={{ 
          '--percentage': (data.active / totalProjects) * 100,
          '--color': '#4CAF50'
        } as React.CSSProperties}>
          <span>Active: {data.active}</span>
        </div>
        <div className={styles.donutSegment} style={{ 
          '--percentage': (data.completed / totalProjects) * 100,
          '--color': '#2196F3'
        } as React.CSSProperties}>
          <span>Completed: {data.completed}</span>
        </div>
        <div className={styles.donutSegment} style={{ 
          '--percentage': (data.onHold / totalProjects) * 100,
          '--color': '#FFC107'
        } as React.CSSProperties}>
          <span>On Hold: {data.onHold}</span>
        </div>
      </div>
    </div>
  );
};

// Progress Timeline Chart Component
interface ProgressTimelineChartProps {
  projects: ProjectWithStats[];
}

const ProgressTimelineChart: React.FC<ProgressTimelineChartProps> = ({ projects }) => {
  return (
    <div className={styles.chartContainer}>
      <div className={styles.timelineChart}>
        {projects.slice(0, 5).map((project) => (
          <div key={project.id} className={styles.timelineItem}>
            <div className={styles.timelineProject}>
              <span className={styles.timelineName}>{project.name}</span>
              <span className={styles.timelineProgress}>{project.progress}%</span>
            </div>
            <div className={styles.timelineBar}>
              <div 
                className={styles.timelineFill}
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className={styles.noData}>No projects available</div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;