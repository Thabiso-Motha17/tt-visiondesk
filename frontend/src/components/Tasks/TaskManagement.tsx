import React from 'react';
import { useSelector } from 'react-redux';
import type{ RootState } from '../../store/store.ts';
import AdminTaskPage from './AdminTaskPage';
import DeveloperTaskPage from './DeveloperTaskPage';
import ClientTaskPage from './ClientTaskPage';
import './TaskManagement.css';

const TaskManagement: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const renderTaskPage = () => {
    switch (user?.role) {
      case 'manager':
        return <AdminTaskPage />;
      case 'admin':
        return <AdminTaskPage />;
      case 'developer':
        return <DeveloperTaskPage />;
      case 'client':
        return <ClientTaskPage />;
    }
  };

  return (
    <div className="task-management">
      {renderTaskPage()}
    </div>
  );
};

export default TaskManagement;