import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  FaUsers, 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaBan,
  FaCheck,
  FaSearch,
  FaFilter,
  FaEye,
  FaKey,
  FaBuilding
} from 'react-icons/fa';
import styles from './UserManagement.module.css';
import { API_URL } from '../../../api.ts';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  company_id?: number;
  is_active: boolean;
  created_at: string;
  company_name?: string;
}

interface Company {
  id: number;
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  company_id?: number;
  is_active?: boolean;
}

interface UpdateUserData {
  name: string;
  email: string;
  role: string;
  company_id?: number;
  is_active: boolean;
}

const UserManagement: React.FC<{onBack: () => void}> = ({ onBack }) => {
  const { user: currentUser, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
      console.error('Error fetching companies:', err);
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [token]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();
      setUsers(prev => [newUser, ...prev]);
      setShowCreateModal(false);
      
      // Show success message
      alert('User created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  const handleUpdateUser = async (userData: UpdateUserData) => {
    if (!selectedUser) return;

    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { ...user, ...updatedUser } : user
      ));
      setShowEditModal(false);
      setSelectedUser(null);
      
      // Show success message
      alert('User updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      setError(null);
      
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          is_active: !user.is_active
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updatedUser } : user
      ));
      
      // Show success message
      alert(`User ${!user.is_active ? 'activated' : 'suspended'} successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
      console.error('Error updating user status:', err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(user => user.id !== userId));
      
      // Show success message
      alert('User deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const refreshData = () => {
    fetchUsers();
    fetchCompanies();
  };

  const stats = {
    total: users.length,
    active: users.filter(user => user.is_active).length,
    admins: users.filter(user => user.role === 'admin').length,
    developers: users.filter(user => user.role === 'developer').length,
    clients: users.filter(user => user.role === 'client').length,
    managers: users.filter(user => user.role === 'manager').length,
  };

  if (loading) return <div className={styles['loading']}>Loading Users...</div>;

  return (
    <div className={styles['user-management']}>
      <div className={styles['page-header']}>
        <div className={styles['header-content']}>
          <button className={styles['btn-back']} onClick={onBack}>
            Back to Dashboard
          </button>
          <h1>User Management</h1>
          <p>Manage users, roles, and access permissions across the platform</p>
        </div>
        <div className={styles['header-actions']}>
          <button className={styles['btn-secondary']} onClick={refreshData}>
            Refresh Data
          </button>
          <button 
            className={styles['btn-primary']}
            onClick={() => setShowCreateModal(true)}
            disabled={currentUser?.role !== 'admin'}
            title={currentUser?.role !== 'admin' ? "Only admins can create users" : "Create new user"}
          >
            <FaUserPlus /> Add New User
          </button>
        </div>
      </div>

      {/* User Statistics */}
      <div className={styles['user-stats-grid']}>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['total']}`}>
            <FaUsers />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.total}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['active']}`}>
            <FaCheck />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.active}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['admin']}`}>
            <FaKey />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.admins}</h3>
            <p>Admins</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['developer']}`}>
            <FaUsers />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.developers}</h3>
            <p>Developers</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['manager']}`}>
            <FaBuilding />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.managers}</h3>
            <p>Managers</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles['filters-section']}>
        <div className={styles['search-box']}>
          <FaSearch className={styles['search-icon']} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles['filter-controls']}>
          <div className={styles['filter-group']}>
            <label>Role</label>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="client">Client</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className={styles['filter-group']}>
            <label>Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles['users-table-container']}>
        <div className={styles['table-header']}>
          <h2>All Users ({filteredUsers.length})</h2>
          <div className={styles['table-actions']}>
            <button className={styles['btn-secondary']}>
              <FaFilter /> Export Users
            </button>
          </div>
        </div>

        <div className={styles['users-table']}>
          <div className={styles['table-header-row']}>
            <div className={`${styles['col']} ${styles['user-info']}`}>User</div>
            <div className={`${styles['col']} ${styles['role']}`}>Role</div>
            <div className={`${styles['col']} ${styles['company']}`}>Company</div>
            <div className={`${styles['col']} ${styles['status']}`}>Status</div>
            <div className={`${styles['col']} ${styles['created']}`}>Created</div>
            <div className={`${styles['col']} ${styles['actions']}`}>Actions</div>
          </div>

          <div className={styles['table-body']}>
            {filteredUsers.map(user => (
              <div key={user.id} className={styles['table-row']}>
                <div className={`${styles['col']} ${styles['user-info']}`}>
                  <div className={styles['user-main-info']}>
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div className={`${styles['col']} ${styles['role']}`}>
                  <span className={`${styles['role-badge']} ${styles[user.role]}`}>
                    {user.role}
                  </span>
                </div>
                <div className={`${styles['col']} ${styles['company']}`}>
                  <span className={styles['company-name']}>
                    {user.company_name || 'No company assigned'}
                  </span>
                </div>
                <div className={`${styles['col']} ${styles['status']}`}>
                  <span className={`${styles['status-badge']} ${user.is_active ? styles['active'] : styles['inactive']}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={`${styles['col']} ${styles['created']}`}>
                  <span className={styles['created-date']}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={`${styles['col']} ${styles['actions']}`}>
                  <div className={styles['action-buttons']}>
                    <button 
                      className={styles['btn-view']}
                      onClick={() => handleEditUser(user)}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className={styles['btn-edit']}
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                      disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'manager' && user.id !== currentUser?.id}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className={`${styles['btn-status']} ${user.is_active ? styles['suspend'] : styles['activate']}`}
                      onClick={() => handleToggleStatus(user.id)}
                      title={user.is_active ? 'Suspend User' : 'Activate User'}
                      disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'manager' || user.id === currentUser?.id}
                    >
                      {user.is_active ? <FaBan /> : <FaCheck />}
                    </button>
                    <button 
                      className={styles['btn-delete']}
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'manager' || user.id === currentUser?.id}
                      title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete User"}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className={styles['no-users']}>
              <FaUsers className={styles['no-users-icon']} />
              <h3>No Users Found</h3>
              <p>
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'No users match your current filters. Try adjusting your search or filters.'
                  : 'No users have been created yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          companies={companies}
          companiesLoading={companiesLoading}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          companies={companies}
          companiesLoading={companiesLoading}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  );
};

// Create User Modal Component
interface CreateUserModalProps {
  companies: Company[];
  companiesLoading: boolean;
  onClose: () => void;
  onSubmit: (userData: CreateUserData) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ companies, companiesLoading, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'developer',
    company_id: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const submitData: CreateUserData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      company_id: formData.company_id ? parseInt(formData.company_id) : undefined,
      is_active: true
    };
    console.log('Data being submitted:', submitData);

    setSubmitting(true);
    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal']}>
        <h2>Create New User</h2>
        <form className={styles['user-form']} onSubmit={handleSubmit}>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div className={styles['form-group']}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                disabled={submitting}
              >
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className={styles['form-group']}>
              <label>Company</label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                disabled={submitting || companiesLoading}
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {companiesLoading && (
                <div className={styles['loading-text']}>Loading companies...</div>
              )}
            </div>
          </div>

          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={submitting}
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className={styles['form-group']}>
              <label>Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={submitting}
                minLength={6}
              />
            </div>
          </div>

          <div className={styles['form-actions']}>
            <button 
              type="button" 
              className={styles['btn-secondary']} 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles['btn-primary']}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: User;
  companies: Company[];
  companiesLoading: boolean;
  onClose: () => void;
  onSubmit: (userData: UpdateUserData) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, companies, companiesLoading, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    company_id: user.company_id?.toString() || '',
    is_active: user.is_active
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: UpdateUserData = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      company_id: formData.company_id ? parseInt(formData.company_id) : undefined,
      is_active: formData.is_active
    };

    setSubmitting(true);
    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal']}>
        <h2>Edit User</h2>
        <form className={styles['user-form']} onSubmit={handleSubmit}>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div className={styles['form-group']}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                disabled={submitting}
              >
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className={styles['form-group']}>
              <label>Company</label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                disabled={submitting || companiesLoading}
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {companiesLoading && (
                <div className={styles['loading-text']}>Loading companies...</div>
              )}
            </div>
          </div>

          <div className={styles['form-group']}>
            <label className={styles['checkbox-label']}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                disabled={submitting}
              />
              <span className={styles['checkmark']}></span>
              Active User
            </label>
          </div>

          <div className={styles['user-info-section']}>
            <h4>User Information</h4>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <strong>User ID:</strong>
                <span>{user.id}</span>
              </div>
              <div className={styles['info-item']}>
                <strong>Created:</strong>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className={styles['info-item']}>
                <strong>Current Company:</strong>
                <span>{user.company_name || 'No company assigned'}</span>
              </div>
            </div>
          </div>

          <div className={styles['form-actions']}>
            <button 
              type="button" 
              className={styles['btn-secondary']} 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles['btn-primary']}
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;