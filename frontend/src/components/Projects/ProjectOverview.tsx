import React from 'react';
import { useSelector } from 'react-redux';
import type{ RootState } from '../../store/store';
import AdminProjectPage from './AdminProjectPage';
import DeveloperProjectPage from './DeveloperProjectPage';
import ClientProjectPage from './ClientProjectPage';
import './ProjectOverview.css';

const ProjectOverview: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const renderProjectPage = () => {
    switch (user?.role) {
      case 'manager':
        return <AdminProjectPage />;
      case 'admin':
        return <AdminProjectPage />;
      case 'developer':
        return <DeveloperProjectPage />;
      case 'client':
        return <ClientProjectPage />;
    }
  };

  return (
    <div className="project-overview">
      {renderProjectPage()}
    </div>
  );
};

export default ProjectOverview;