import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Dashboard from './components/Dashboard/Dashboard'
import TaskManagement from './components/Tasks/TaskManagement';
import ProjectOverview from './components/Projects/ProjectOverview';
import Header from './components/Layout/Header';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';
import LandingPage from './components/Pages/LandingPage';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute>
                    <TaskManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute>
                    <ProjectOverview />
                  </ProtectedRoute>
                } 
              />
          
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
};

export default App;