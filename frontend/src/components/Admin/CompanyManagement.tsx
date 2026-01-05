import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  FaBuilding, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaBan,
  FaCheck,
  FaSearch,
  FaFilter,
  FaEye,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';
import styles from './CompanyManagement.module.css';
import { API_URL } from '../../../api';

interface Company {
  id: number;
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
  created_at: string;
  user_count?: number;
  project_count?: number;
}

interface CreateCompanyData {
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
}

interface UpdateCompanyData {
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
}

const CompanyManagement: React.FC<{onBack: () => void}> = ({ onBack }) => {
  const { user: currentUser, token } = useSelector((state: RootState) => state.auth);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  
  const fetchCompanies = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [token]);

  const handleCreateCompany = async (companyData: CreateCompanyData) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      const newCompany = await response.json();
      setCompanies(prev => [newCompany, ...prev]);
      setShowCreateModal(false);
      
      
      alert('Company created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
      console.error('Error creating company:', err);
    }
  };

  const handleUpdateCompany = async (companyData: UpdateCompanyData) => {
    if (!selectedCompany) return;

    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company');
      }

      const updatedCompany = await response.json();
      setCompanies(prev => prev.map(company => 
        company.id === selectedCompany.id ? { ...company, ...updatedCompany } : company
      ));
      setShowEditModal(false);
      setSelectedCompany(null);
      
      
      alert('Company updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company');
      console.error('Error updating company:', err);
    }
  };

  const handleDeleteCompany = async (companyId: number) => {
    if (!window.confirm('Are you sure you want to delete this company? This will also delete all associated users and projects. This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete company');
      }

      setCompanies(prev => prev.filter(company => company.id !== companyId));
      
      
      alert('Company deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
      console.error('Error deleting company:', err);
    }
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowEditModal(true);
  };

  
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: companies.length,
    active: companies.length,  
    withPhone: companies.filter(company => company.phone).length,
    withAddress: companies.filter(company => company.address).length,
  };

  if (loading) return <div className={styles.loading}>Loading Companies...</div>;

  return (
    <div className={styles['company-management']}>
      <div className={styles['page-header']}>
        <div className={styles['header-content']}>
          <button className={styles['btn-back']} onClick={onBack}>
            Back to Dashboard
          </button>
          <h1>Company Management</h1>
          <p>Manage companies and their information across the platform</p>
        </div>
        <button 
          className={styles['btn-primary']}
          onClick={() => setShowCreateModal(true)}
          disabled={currentUser?.role !== 'admin'}
        >
          <FaPlus /> Add New Company
        </button>
      </div>

      {}
      {error && (
        <div className={styles['error-message']}>
          <FaBan /> {error}
          <button onClick={() => setError(null)} className={styles['error-close']}>
            ×
          </button>
        </div>
      )}

      {}
      <div className={styles['company-stats-grid']}>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['total']}`}>
            <FaBuilding />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.total}</h3>
            <p>Total Companies</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['active']}`}>
            <FaCheck />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.active}</h3>
            <p>Active Companies</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['phone']}`}>
            <FaPhone />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.withPhone}</h3>
            <p>With Phone</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={`${styles['stat-icon']} ${styles['address']}`}>
            <FaMapMarkerAlt />
          </div>
          <div className={styles['stat-info']}>
            <h3>{stats.withAddress}</h3>
            <p>With Address</p>
          </div>
        </div>
      </div>

      {}
      <div className={styles['filters-section']}>
        <div className={styles['search-box']}>
          <FaSearch className={styles['search-icon']} />
          <input
            type="text"
            placeholder="Search companies by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles['filter-controls']}>
          <div className={styles['filter-group']}>
            <label>Sort By</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Companies</option>
              <option value="recent">Recently Added</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {}
      <div className={styles['companies-table-container']}>
        <div className={styles['table-header']}>
          <h2>All Companies ({filteredCompanies.length})</h2>
          <div className={styles['table-actions']}>
            <button className={styles['btn-secondary']}>
              <FaFilter /> Export Companies
            </button>
          </div>
        </div>

        <div className={styles['companies-table']}>
          <div className={styles['table-header-row']}>
            <div className={`${styles['col']} ${styles['company-info']}`}>Company</div>
            <div className={`${styles['col']} ${styles['contact']}`}>Contact</div>
            <div className={`${styles['col']} ${styles['phone']}`}>Phone</div>
            <div className={`${styles['col']} ${styles['address']}`}>Address</div>
            <div className={`${styles['col']} ${styles['created']}`}>Created</div>
            <div className={`${styles['col']} ${styles['actions']}`}>Actions</div>
          </div>

          <div className={styles['table-body']}>
            {filteredCompanies.map(company => (
              <div key={company.id} className={styles['table-row']}>
                <div className={`${styles['col']} ${styles['company-info']}`}>
                  <div className={styles['company-main-info']}>
                    <h4>{company.name}</h4>
                    <p>ID: {company.id}</p>
                  </div>
                </div>
                <div className={`${styles['col']} ${styles['contact']}`}>
                  <span className={styles['contact-email']}>
                    <FaEnvelope /> {company.contact_email}
                  </span>
                </div>
                <div className={`${styles['col']} ${styles['phone']}`}>
                  <span className={styles['phone-number']}>
                    {company.phone ? (
                      <>
                        <FaPhone /> {company.phone}
                      </>
                    ) : (
                      <span className={styles['not-provided']}>Not provided</span>
                    )}
                  </span>
                </div>
                <div className={`${styles['col']} ${styles['address']}`}>
                  <span className={styles['company-address']}>
                    {company.address ? (
                      <>
                        <FaMapMarkerAlt /> {company.address}
                      </>
                    ) : (
                      <span className={styles['not-provided']}>Not provided</span>
                    )}
                  </span>
                </div>
                <div className={`${styles['col']} ${styles['created']}`}>
                  <span className={styles['created-date']}>
                    {new Date(company.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={`${styles['col']} ${styles['actions']}`}>
                  <div className={styles['action-buttons']}>
                    <button 
                      className={styles['btn-view']}
                      onClick={() => handleEditCompany(company)}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className={styles['btn-edit']}
                      onClick={() => handleEditCompany(company)}
                      title="Edit Company"
                      disabled={currentUser?.role !== 'admin'}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className={styles['btn-delete']}
                      onClick={() => handleDeleteCompany(company.id)}
                      disabled={currentUser?.role !== 'admin'}
                      title="Delete Company"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className={styles['no-companies']}>
              <p>No companies found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {}
      {showCreateModal && (
        <CreateCompanyModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCompany}
        />
      )}

      {}
      {showEditModal && selectedCompany && (
        <EditCompanyModal
          company={selectedCompany}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCompany(null);
          }}
          onSubmit={handleUpdateCompany}
        />
      )}
    </div>
  );
};


interface CreateCompanyModalProps {
  onClose: () => void;
  onSubmit: (companyData: CreateCompanyData) => void;
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    phone: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: CreateCompanyData = {
      name: formData.name,
      contact_email: formData.contact_email,
      phone: formData.phone || undefined,
      address: formData.address || undefined
    };

    onSubmit(submitData);
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal']}>
        <h2>Create New Company</h2>
        <form className={styles['company-form']} onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label>Company Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles['form-group']}>
            <label>Contact Email *</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              required
            />
          </div>

          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className={styles['form-group']}>
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Optional"
              rows={3}
            />
          </div>

          <div className={styles['form-actions']}>
            <button type="button" className={styles['btn-secondary']} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles['btn-primary']}>
              Create Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface EditCompanyModalProps {
  company: Company;
  onClose: () => void;
  onSubmit: (companyData: UpdateCompanyData) => void;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({ company, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: company.name,
    contact_email: company.contact_email,
    phone: company.phone || '',
    address: company.address || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: UpdateCompanyData = {
      name: formData.name,
      contact_email: formData.contact_email,
      phone: formData.phone || undefined,
      address: formData.address || undefined
    };

    onSubmit(submitData);
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal']}>
        <h2>Edit Company</h2>
        <form className={styles['company-form']} onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label>Company Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles['form-group']}>
            <label>Contact Email *</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              required
            />
          </div>

          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className={styles['form-group']}>
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Optional"
              rows={3}
            />
          </div>

          <div className={styles['company-info-section']}>
            <h4>Company Information</h4>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <strong>Company ID:</strong>
                <span>{company.id}</span>
              </div>
              <div className={styles['info-item']}>
                <strong>Created:</strong>
                <span>{new Date(company.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className={styles['form-actions']}>
            <button type="button" className={styles['btn-secondary']} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles['btn-primary']}>
              Update Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyManagement;
