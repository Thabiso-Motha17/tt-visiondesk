import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import type { RootState } from '../../store/store';
import { logout } from '../../store/slices/AuthSlice';
import { 
  FaTasks, 
  FaProjectDiagram, 
  FaChartBar, 
  FaUser, 
  FaSignOutAlt,
  FaEdit,
  FaTimes,
} from 'react-icons/fa';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  const [showUserModal, setShowUserModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });



  const handleLogout = () => {
    const con = confirm('Are you sure you want to logout?');
    if(con){
      dispatch(logout());
    }
  };

  const handleUserIconClick = () => {
    setShowUserModal(true);
    setEditMode(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setEditMode(false);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert('New passwords do not match!');
        return;
      }
      if (!formData.currentPassword) {
        alert('Please enter your current password to change password.');
        return;
      }
    }

    console.log('Updating user:', formData);

    setTimeout(() => {
      alert('Profile updated successfully!');
      setEditMode(false);
      setShowUserModal(false);
    }, 500);
  };

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) return null;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <h1 className={styles.brandTitle}>T&T VisionDesk</h1>
          <span className={styles.brandSlogan}>progress tracking made easy</span>
        </div>

        <nav className={styles.headerNav}>
          <Link 
            to="/dashboard" 
            className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}
          >
            <FaChartBar className={styles.navIcon} />
            Dashboard
          </Link>
          <Link 
            to="/projects" 
            className={`${styles.navLink} ${isActive('/projects') ? styles.active : ''}`}
          >
            <FaProjectDiagram className={styles.navIcon} />
            Projects
          </Link>
          <Link 
            to="/tasks" 
            className={`${styles.navLink} ${isActive('/tasks') ? styles.active : ''}`}
          >
            <FaTasks className={styles.navIcon} />
            Tasks
          </Link>
        </nav>

        <div className={styles.headerUser}>

          <button 
            onClick={handleUserIconClick}
            className={styles.userIconBtn}
            title="Edit Profile"
          >
            <FaUser className={styles.userIcon} />
          </button>
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.userRole}>({user?.role})</span>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      {/* User Profile Modal */}
      {showUserModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>User Profile</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.userProfile}>
              <div className={styles.profileHeader}>
                <div className={styles.avatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <h3>{user?.name}</h3>
                  <p>{user?.email}</p>
                  <span className={styles.roleBadge}>{user?.role}</span>
                </div>
                <button 
                  className={styles.editToggleBtn}
                  onClick={handleEditToggle}
                >
                  <FaEdit />
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>

              <form className={styles.profileForm} onSubmit={handleSaveChanges}>
                <div className={styles.formSection}>
                  <h4>Personal Information</h4>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      className={editMode ? styles.editable : ''}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      className={editMode ? styles.editable : ''}
                    />
                  </div>
                </div>

                {editMode && (
                  <div className={styles.formSection}>
                    <h4>Change Password</h4>
                    <div className={styles.formGroup}>
                      <label>Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        placeholder="Enter current password"
                        className={styles.editable}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Enter new password"
                        className={styles.editable}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm new password"
                        className={styles.editable}
                      />
                    </div>
                  </div>
                )}

                {editMode && (
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.btnPrimary}>
                      Save Changes
                    </button>
                    <button 
                      type="button" 
                      className={styles.btnSecondary}
                      onClick={handleEditToggle}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              {!editMode && (
                <div className={styles.profileStats}>
                  <h4>Account Information</h4>
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <strong>Member Since</strong>
                      <span>2025/10/08</span>
                    </div>
                    <div className={styles.statItem}>
                      <strong>Last Login</strong>
                      <span>Today</span>
                    </div>
                    <div className={styles.statItem}>
                      <strong>Status</strong>
                      <span className={styles.statusActive}>Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;