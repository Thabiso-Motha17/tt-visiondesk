import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
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
  FaUsers,
  FaStar,
  FaComments
} from 'react-icons/fa';
import styles from './AdminDashboard.module.css';
import TextType from '../../ui/TextType';
import { MdBusiness } from 'react-icons/md';
import UserManagement from '../Admin/UserManagement';
import CompanyManagement from '../Admin/CompanyManagement';
import { 
  fetchRatingsDashboard, 
  selectRatingsDashboard,
  selectRatingsLoading,
  selectRatingsError,
  clearRatingsError
} from '../../store/slices/ratingsSlice';

const ManagerDashboard: React.FC = () => {
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const ratingsDashboard = useSelector(selectRatingsDashboard);
  const ratingsLoading = useSelector(selectRatingsLoading);
  const ratingsError = useSelector(selectRatingsError);
  
  const dispatch = useDispatch();

  const [activeView, setActiveView] = useState<
    'dashboard' | 
    'user-management' | 
    'project-definition' | 
    'request-review' | 
    'reporting' | 
    'workload-monitoring' | 
    'deadline-management' |
    'company-management' |
    'client-ratings'
  >('dashboard');

  useEffect(() => {
    dispatch(fetchTasks() as any);
    dispatch(fetchProjects() as any);
    dispatch(fetchRatingsDashboard() as any);
  }, [dispatch]);

  // Clear errors when changing views
  useEffect(() => {
    if (ratingsError.dashboard) {
      dispatch(clearRatingsError('dashboard'));
    }
  }, [activeView, dispatch, ratingsError.dashboard]);

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
    // Ratings stats from Redux
    averageProjectRating: ratingsDashboard.project_ratings.average_rating || 0,
    totalProjectRatings: ratingsDashboard.project_ratings.total_ratings || 0,
    projectsRated: ratingsDashboard.project_ratings.projects_rated || 0,
    uniqueRaters: ratingsDashboard.project_ratings.unique_raters || 0,
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
      case 'client-ratings':
        return <ClientRatingsView onBack={() => setActiveView('dashboard')} />;
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

        {/* Ratings Stats */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.ratings}`}>
            <FaStar />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.averageProjectRating.toFixed(1)}</h3>
            <p>Avg. Rating</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.feedback}`}>
            <FaComments />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.totalProjectRatings}</h3>
            <p>Client Ratings</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {ratingsError.dashboard && (
        <div className={styles.errorMessage}>
          <p>Error loading ratings: {ratingsError.dashboard}</p>
          <button 
            onClick={() => dispatch(fetchRatingsDashboard() as any)}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

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

          {/* New Client Ratings Feature Card */}
          <div className={styles.featureCard}>
            <FaStar className={styles.featureIcon} />
            <h3>Client Ratings</h3>
            <p>View and analyze client feedback and project ratings</p>
            <button 
              className={styles.featureBtn}
              onClick={() => setActiveView('client-ratings')}
            >
              View Ratings
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

        {/* Recent Ratings Section */}
        <div className={styles.activitySection}>
          <h3>Recent Client Ratings</h3>
          <div className={styles.activityList}>
            {ratingsDashboard.recent_project_ratings.slice(0, 5).map((rating: any) => (
              <div key={rating.id} className={styles.activityItem}>
                <div className={styles.ratingInfo}>
                  <span className={styles.projectName}>{rating.project_name}</span>
                  <div className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar 
                        key={star} 
                        className={star <= rating.rating ? styles.filledStar : styles.emptyStar} 
                        size={12}
                      />
                    ))}
                  </div>
                </div>
                <span className={styles.ratingValue}>{rating.rating}/5</span>
              </div>
            ))}
            {ratingsDashboard.recent_project_ratings.length === 0 && (
              <div className={styles.noData}>No ratings yet</div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const loading = tasksLoading || projectsLoading || ratingsLoading.dashboard;

  if (loading) return <div className={styles.loading}>Loading Manager Dashboard...</div>;

  return (
    <div className={styles.adminDashboard}>
      {renderCurrentView()}
    </div>
  );
};

// Client Ratings View Component
interface ClientRatingsViewProps {
  onBack: () => void;
}

const ClientRatingsView: React.FC<ClientRatingsViewProps> = ({ onBack }) => {
  const ratingsDashboard = useSelector(selectRatingsDashboard);
  const ratingsLoading = useSelector(selectRatingsLoading);
  const ratingsError = useSelector(selectRatingsError);
  const dispatch = useDispatch();

  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter ratings based on search and filter criteria
  const filteredRatings = ratingsDashboard.recent_project_ratings.filter((rating: any) => {
    const matchesSearch = rating.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rating.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rating.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'high' && rating.rating >= 4) ||
      (filter === 'low' && rating.rating <= 2);

    return matchesSearch && matchesFilter;
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#4CAF50'; // Green
    if (rating >= 3) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getRecommendationText = (wouldRecommend: boolean) => {
    return wouldRecommend ? 
      { text: 'Would Recommend', class: styles.recommended } : 
      { text: 'Would Not Recommend', class: styles.notRecommended };
  };

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = ratingsDashboard.recent_project_ratings.filter(
      (r: any) => r.rating === star
    ).length;
    const total = ratingsDashboard.recent_project_ratings.length;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return { star, count, percentage };
  });

  if (ratingsError.dashboard) {
    return (
      <div className={styles.ratingsView}>
        <div className={styles.viewHeader}>
          <button className={styles.backButton} onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h1>Client Ratings & Feedback</h1>
        </div>
        <div className={styles.errorMessage}>
          <p>Error loading ratings: {ratingsError.dashboard}</p>
          <button 
            onClick={() => dispatch(fetchRatingsDashboard() as any)}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ratingsView}>
      <div className={styles.viewHeader}>
        <button className={styles.backButton} onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>Client Ratings & Feedback</h1>
        <p>Monitor and analyze client satisfaction across all projects</p>
      </div>

      {/* Ratings Overview */}
      <div className={styles.ratingsOverview}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <FaStar />
          </div>
          <div className={styles.overviewContent}>
            <h3>{ratingsDashboard.project_ratings.average_rating.toFixed(1)}</h3>
            <p>Average Rating</p>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <FaComments />
          </div>
          <div className={styles.overviewContent}>
            <h3>{ratingsDashboard.project_ratings.total_ratings}</h3>
            <p>Total Ratings</p>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <FaProjectDiagram />
          </div>
          <div className={styles.overviewContent}>
            <h3>{ratingsDashboard.project_ratings.projects_rated}</h3>
            <p>Projects Rated</p>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <FaUsers />
          </div>
          <div className={styles.overviewContent}>
            <h3>{ratingsDashboard.project_ratings.unique_raters}</h3>
            <p>Unique Clients</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.ratingsControls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by project, client, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterButtons}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All Ratings
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'high' ? styles.active : ''}`}
            onClick={() => setFilter('high')}
          >
            High Ratings (4-5)
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'low' ? styles.active : ''}`}
            onClick={() => setFilter('low')}
          >
            Low Ratings (1-2)
          </button>
        </div>
      </div>

      {/* Ratings List */}
      <div className={styles.ratingsList}>
        <h2>Client Feedback ({filteredRatings.length})</h2>
        
        {ratingsLoading.dashboard ? (
          <div className={styles.loading}>Loading ratings...</div>
        ) : filteredRatings.length === 0 ? (
          <div className={styles.noData}>
            {searchTerm ? 'No ratings match your search' : 'No ratings available'}
          </div>
        ) : (
          <div className={styles.ratingsGrid}>
            {filteredRatings.map((rating: any) => {
              const recommendation = getRecommendationText(rating.would_recommend);
              return (
                <div key={rating.id} className={styles.ratingCard}>
                  <div className={styles.ratingHeader}>
                    <div className={styles.projectInfo}>
                      <h4>{rating.project_name || `Project ${rating.project_id}`}</h4>
                      <span className={styles.ratingDate}>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div 
                      className={styles.ratingBadge}
                      style={{ backgroundColor: getRatingColor(rating.rating) }}
                    >
                      {rating.rating}/5
                    </div>
                  </div>

                  <div className={styles.ratingDetails}>
                    <div className={styles.stars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar 
                          key={star} 
                          className={star <= rating.rating ? styles.filledStar : styles.emptyStar} 
                        />
                      ))}
                    </div>
                    
                    <div className={`${styles.recommendation} ${recommendation.class}`}>
                      {recommendation.text}
                    </div>
                  </div>

                  {rating.user_name && (
                    <div className={styles.clientInfo}>
                      <strong>Client:</strong> {rating.user_name}
                      {rating.user_role && ` (${rating.user_role})`}
                    </div>
                  )}

                  {rating.comment && (
                    <div className={styles.comment}>
                      <p>"{rating.comment}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      <div className={styles.ratingDistribution}>
        <h2>Rating Distribution</h2>
        <div className={styles.distributionBars}>
          {ratingDistribution.map(({ star, count, percentage }) => (
            <div key={star} className={styles.distributionBar}>
              <div className={styles.barLabel}>
                <span>{star} Star{star !== 1 ? 's' : ''}</span>
                <span>({count})</span>
              </div>
              <div className={styles.barTrack}>
                <div 
                  className={styles.barFill}
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: getRatingColor(star)
                  }}
                ></div>
              </div>
              <div className={styles.barPercentage}>
                {percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;