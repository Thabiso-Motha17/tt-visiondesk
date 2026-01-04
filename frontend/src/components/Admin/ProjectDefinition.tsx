import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave,
  FaTimes,
  FaCalendar,
  FaCheckCircle,
} from 'react-icons/fa';
import styles from './ProjectDefinition.module.css';

interface Project {
  id: number;
  name: string;
  description: string;
  client_company_id: number;
  admin_id: number;
  status: string;
  deadline: string;
  success_indicators: string[];
  milestones: Milestone[];
  criteria: string;
  client_company_name?: string;
  admin_name?: string;
}

interface Milestone {
  id: number;
  name: string;
  description: string;
  deadline: string;
  completed: boolean;
  project_id: number;
}

interface Company {
  id: number;
  name: string;
}

const ProjectDefinition: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/companies', {
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
      console.error('Error fetching companies:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchCompanies();
  }, [token]);

  const handleCreateProject = async (projectData: any) => {
    try {
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...projectData,
          client_company_id: parseInt(projectData.client_company_id),
          admin_id: user?.id,
          status: 'active'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const newProject = await response.json();
      setProjects([...projects, newProject]);
      setShowCreateModal(false);
      
      alert('Project created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      console.error('Error creating project:', err);
    }
  };

  const handleUpdateProject = async (projectData: any) => {
    if (!editingProject) return;

    try {
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...projectData,
          client_company_id: parseInt(projectData.client_company_id)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      const updatedProject = await response.json();
      setProjects(projects.map(project => 
        project.id === editingProject.id ? { ...project, ...updatedProject } : project
      ));
      setEditingProject(null);
      
      alert('Project updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      console.error('Error updating project:', err);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      setProjects(projects.filter(project => project.id !== projectId));
      alert('Project deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      console.error('Error deleting project:', err);
    }
  };

  const handleCreateMilestone = async (projectId: number, milestoneData: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/milestones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...milestoneData,
          project_id: projectId,
          completed: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create milestone');
      }

      return await response.json();
    } catch (err) {
      console.error('Error creating milestone:', err);
      throw err;
    }
  };

  const handleUpdateMilestone = async (milestoneId: number, milestoneData: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update milestone');
      }

      return await response.json();
    } catch (err) {
      console.error('Error updating milestone:', err);
      throw err;
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete milestone');
      }
    } catch (err) {
      console.error('Error deleting milestone:', err);
      throw err;
    }
  };

  if (loading) return <div className={styles.loading}>Loading Projects...</div>;

  return (
    <div className={styles.projectDefinition}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <button className={styles.btnBack} onClick={onBack}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1>Project Definition</h1>
          <p>Define project criteria, milestones, and success indicators</p>
        </div>
        <button 
          className={styles.btnPrimary}
          onClick={() => setShowCreateModal(true)}
          disabled={user?.role !== 'admin' && user?.role !== 'manager'}
        >
          <FaPlus /> Define New Project
        </button>
      </div>

      <div className={styles.projectsList}>
        {projects.map(project => (
          <div key={project.id} className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <div className={styles.projectTitle}>
                <h3>{project.name}</h3>
                <div className={styles.projectMeta}>
                  <span className={`${styles.status} ${styles[project.status]}`}>
                    {project.status}
                  </span>
                  {project.client_company_name && (
                    <span className={styles.company}>
                      Client: {project.client_company_name}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.projectActions}>
                <button 
                  className={styles.btnEdit}
                  onClick={() => setEditingProject(project)}
                  disabled={user?.role !== 'admin' && user?.role !== 'manager'}
                >
                  <FaEdit /> Edit Definition
                </button>
                <button 
                  className={styles.btnDelete}
                  onClick={() => handleDeleteProject(project.id)}
                  disabled={user?.role !== 'admin' && user?.role !== 'manager'}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>

            <div className={styles.projectDetails}>
              <div className={styles.detailSection}>
                <h4>Project Description</h4>
                <p>{project.description}</p>
              </div>

              <div className={styles.detailSection}>
                <h4>Success Criteria</h4>
                <p>{project.criteria || 'No criteria defined yet.'}</p>
              </div>

              <div className={styles.detailSection}>
                <h4>Success Indicators</h4>
                {project.success_indicators && project.success_indicators.length > 0 ? (
                  <ul className={styles.indicatorsList}>
                    {project.success_indicators.map((indicator, index) => (
                      <li key={index}>
                        <FaCheckCircle className={styles.indicatorIcon} />
                        {indicator}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.noData}>No success indicators defined yet.</p>
                )}
              </div>

              <div className={styles.detailSection}>
                <h4>Milestones</h4>
                {project.milestones && project.milestones.length > 0 ? (
                  <div className={styles.milestonesList}>
                    {project.milestones.map(milestone => (
                      <div key={milestone.id} className={`${styles.milestoneItem} ${milestone.completed ? styles.completed : ''}`}>
                        <div className={styles.milestoneInfo}>
                          <h5>{milestone.name}</h5>
                          <p>{milestone.description}</p>
                          <span className={styles.milestoneDeadline}>
                            <FaCalendar />
                            Due: {new Date(milestone.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.milestoneStatus}>
                          {milestone.completed ? (
                            <span className={styles.statusCompleted}>Completed</span>
                          ) : (
                            <span className={styles.statusPending}>Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>No milestones defined yet.</p>
                )}
              </div>

              {project.deadline && (
                <div className={styles.projectDeadline}>
                  <FaCalendar />
                  <strong>Overall Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className={styles.noProjects}>
          <p>No projects defined yet. Create your first project to get started.</p>
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          companies={companies}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          companies={companies}
          onClose={() => setEditingProject(null)}
          onSubmit={handleUpdateProject}
          onMilestoneCreate={handleCreateMilestone}
          onMilestoneUpdate={handleUpdateMilestone}
          onMilestoneDelete={handleDeleteMilestone}
        />
      )}
    </div>
  );
};

interface CreateProjectModalProps {
  companies: Company[];
  onClose: () => void;
  onSubmit: (projectData: any) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ companies, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_company_id: '',
    deadline: '',
    criteria: '',
    success_indicators: [''],
    milestones: [{ name: '', description: '', deadline: '' }]
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        success_indicators: formData.success_indicators.filter(indicator => indicator.trim() !== ''),
        milestones: formData.milestones
          .filter(milestone => milestone.name.trim() !== '')
          .map(milestone => ({
            name: milestone.name,
            description: milestone.description,
            deadline: milestone.deadline
          }))
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addSuccessIndicator = () => {
    setFormData({
      ...formData,
      success_indicators: [...formData.success_indicators, '']
    });
  };

  const updateSuccessIndicator = (index: number, value: string) => {
    const updated = [...formData.success_indicators];
    updated[index] = value;
    setFormData({ ...formData, success_indicators: updated });
  };

  const removeSuccessIndicator = (index: number) => {
    const updated = formData.success_indicators.filter((_, i) => i !== index);
    setFormData({ ...formData, success_indicators: updated });
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { name: '', description: '', deadline: '' }]
    });
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...formData.milestones];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, milestones: updated });
  };

  const removeMilestone = (index: number) => {
    const updated = formData.milestones.filter((_, i) => i !== index);
    setFormData({ ...formData, milestones: updated });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.large}`}>
        <h2>Define New Project</h2>
        <form className={styles.projectForm} onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h3>Basic Information</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Client Company *</label>
                <select
                  value={formData.client_company_id}
                  onChange={(e) => setFormData({ ...formData, client_company_id: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Project Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
                disabled={submitting}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Project Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Success Criteria</h3>
            <div className={styles.formGroup}>
              <label>Project Criteria</label>
              <textarea
                value={formData.criteria}
                onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                rows={2}
                placeholder="Define what success looks like for this project..."
                disabled={submitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Success Indicators</label>
              {formData.success_indicators.map((indicator, index) => (
                <div key={index} className={styles.arrayInputGroup}>
                  <input
                    type="text"
                    value={indicator}
                    onChange={(e) => updateSuccessIndicator(index, e.target.value)}
                    placeholder="e.g., User satisfaction score > 4.5/5"
                    disabled={submitting}
                  />
                  {formData.success_indicators.length > 1 && (
                    <button
                      type="button"
                      className={styles.btnRemove}
                      onClick={() => removeSuccessIndicator(index)}
                      disabled={submitting}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className={styles.btnAdd} 
                onClick={addSuccessIndicator}
                disabled={submitting}
              >
                <FaPlus /> Add Success Indicator
              </button>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Project Milestones</h3>
            {formData.milestones.map((milestone, index) => (
              <div key={index} className={styles.milestoneForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Milestone Name</label>
                    <input
                      type="text"
                      value={milestone.name}
                      onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Deadline</label>
                    <input
                      type="date"
                      value={milestone.deadline}
                      onChange={(e) => updateMilestone(index, 'deadline', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    rows={2}
                    disabled={submitting}
                  />
                </div>
                {formData.milestones.length > 1 && (
                  <button
                    type="button"
                    className={styles.btnRemove}
                    onClick={() => removeMilestone(index)}
                    disabled={submitting}
                  >
                    <FaTimes /> Remove Milestone
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              className={styles.btnAdd} 
              onClick={addMilestone}
              disabled={submitting}
            >
              <FaPlus /> Add Milestone
            </button>
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Creating...
                </>
              ) : (
                <>
                  <FaSave /> Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditProjectModalProps {
  project: Project;
  companies: Company[];
  onClose: () => void;
  onSubmit: (projectData: any) => void;
  onMilestoneCreate: (projectId: number, milestoneData: any) => Promise<any>;
  onMilestoneUpdate: (milestoneId: number, milestoneData: any) => Promise<any>;
  onMilestoneDelete: (milestoneId: number) => Promise<void>;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ 
  project, 
  companies, 
  onClose, 
  onSubmit,
  onMilestoneCreate,
  onMilestoneUpdate,
  onMilestoneDelete
}) => {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    client_company_id: project.client_company_id.toString(),
    deadline: project.deadline,
    criteria: project.criteria,
    success_indicators: project.success_indicators || [''],
    milestones: project.milestones || []
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        success_indicators: formData.success_indicators.filter(indicator => indicator.trim() !== '')
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addSuccessIndicator = () => {
    setFormData({
      ...formData,
      success_indicators: [...formData.success_indicators, '']
    });
  };

  const updateSuccessIndicator = (index: number, value: string) => {
    const updated = [...formData.success_indicators];
    updated[index] = value;
    setFormData({ ...formData, success_indicators: updated });
  };

  const removeSuccessIndicator = (index: number) => {
    const updated = formData.success_indicators.filter((_, i) => i !== index);
    setFormData({ ...formData, success_indicators: updated });
  };

  const addMilestone = async () => {
    try {
      const newMilestone = {
        name: 'New Milestone',
        description: '',
        deadline: '',
        completed: false
      };
      
      const createdMilestone = await onMilestoneCreate(project.id, newMilestone);
      setFormData({
        ...formData,
        milestones: [...formData.milestones, createdMilestone]
      });
    } catch (error) {
      console.error('Error creating milestone:', error);
    }
  };

  const updateMilestone = async (index: number, field: string, value: any) => {
    const milestone = formData.milestones[index];
    if (!milestone) return;

    try {
      const updatedMilestone = { ...milestone, [field]: value };
      await onMilestoneUpdate(milestone.id, updatedMilestone);
      
      const updated = [...formData.milestones];
      updated[index] = updatedMilestone;
      setFormData({ ...formData, milestones: updated });
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const removeMilestone = async (index: number) => {
    const milestone = formData.milestones[index];
    if (!milestone) return;

    try {
      await onMilestoneDelete(milestone.id);
      const updated = formData.milestones.filter((_, i) => i !== index);
      setFormData({ ...formData, milestones: updated });
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.large}`}>
        <h2>Edit Project Definition</h2>
        <form className={styles.projectForm} onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h3>Basic Information</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Client Company *</label>
                <select
                  value={formData.client_company_id}
                  onChange={(e) => setFormData({ ...formData, client_company_id: e.target.value })}
                  required
                  disabled={submitting}
                >
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Project Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
                disabled={submitting}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Project Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Success Criteria</h3>
            <div className={styles.formGroup}>
              <label>Project Criteria</label>
              <textarea
                value={formData.criteria}
                onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                rows={2}
                disabled={submitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Success Indicators</label>
              {formData.success_indicators.map((indicator, index) => (
                <div key={index} className={styles.arrayInputGroup}>
                  <input
                    type="text"
                    value={indicator}
                    onChange={(e) => updateSuccessIndicator(index, e.target.value)}
                    disabled={submitting}
                  />
                  {formData.success_indicators.length > 1 && (
                    <button
                      type="button"
                      className={styles.btnRemove}
                      onClick={() => removeSuccessIndicator(index)}
                      disabled={submitting}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className={styles.btnAdd} 
                onClick={addSuccessIndicator}
                disabled={submitting}
              >
                <FaPlus /> Add Success Indicator
              </button>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Project Milestones</h3>
            {formData.milestones.map((milestone, index) => (
              <div key={milestone.id} className={styles.milestoneForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Milestone Name *</label>
                    <input
                      type="text"
                      value={milestone.name}
                      onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Deadline</label>
                    <input
                      type="date"
                      value={milestone.deadline}
                      onChange={(e) => updateMilestone(index, 'deadline', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    rows={2}
                    disabled={submitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={milestone.completed}
                      onChange={(e) => updateMilestone(index, 'completed', e.target.checked)}
                      disabled={submitting}
                    />
                    Completed
                  </label>
                </div>
                <button
                  type="button"
                  className={styles.btnRemove}
                  onClick={() => removeMilestone(index)}
                  disabled={submitting}
                >
                  <FaTimes /> Remove Milestone
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className={styles.btnAdd} 
              onClick={addMilestone}
              disabled={submitting}
            >
              <FaPlus /> Add Milestone
            </button>
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnSecondary} 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel 
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave /> Update Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectDefinition;