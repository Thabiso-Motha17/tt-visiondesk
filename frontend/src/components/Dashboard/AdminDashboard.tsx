import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type{ RootState } from '../../store/store';
import { fetchTasks } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import UserManagement from '../Admin/UserManagement';
import { 
  FaUsers, 
} from 'react-icons/fa';
import { MdBusiness} from 'react-icons/md'
import styles from './AdminDashboard.module.css';
import CompanyManagement from '../Admin/CompanyManagement';
import TextType from '../../ui/TextType';

const AdminDashboard: React.FC = () => {
  const {  loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const {  loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const dispatch = useDispatch();

  const [activeView, setActiveView] = useState<
    'dashboard' | 
    'user-management' | 
    'company-management'
  >('dashboard');

  useEffect(() => {
    dispatch(fetchTasks() as any);
    dispatch(fetchProjects() as any);
  }, [dispatch]);

  const renderCurrentView = () => {
    switch (activeView) {
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
        <h1>Admin Dashboard</h1>
        <TextType
          text={["Welcome Admin","Manage users, and associated companies"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="|"
        />
      </div>

      {/* Admin Features Grid */}
      <div className={styles.adminFeatures}>
        <h2>Admin Controls</h2>
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
        </div>
      </div>
    </>
  );

  if (tasksLoading || projectsLoading) return <div className={styles.loading}>Loading Admin Dashboard...</div>;

  return (
    <div className={styles.adminDashboard}>
      {renderCurrentView()}
    </div>
  );
};

export default AdminDashboard;