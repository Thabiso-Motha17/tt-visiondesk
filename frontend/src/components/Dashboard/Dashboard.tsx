import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import AdminDashboard from './AdminDashboard';
import DeveloperDashboard from './DeveloperDashboard';
import ClientDashboard from './ClientDashboard';
import './Dashboard.css';
import ManagerDashboard from './ManagerDashboard';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    console.log('User role changed:', user?.role);
  }, [user?.role]);

  if (!user) {
    return <div>Loading...</div>;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'developer':
      return <DeveloperDashboard />;
    case 'client':
      return <ClientDashboard />;
    default:
      return <div>Unknown user role: {user.role}</div>;
  }
};

export default Dashboard;