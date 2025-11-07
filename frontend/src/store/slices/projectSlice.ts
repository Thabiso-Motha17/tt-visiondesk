import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

  interface Project {
    id: number;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold' | 'inactive';
    deadline: string;
    client_company_id: number;
    admin_id: number;
    client_company_name: string;
    admin_name: string;
    created_at: string;
    updated_at: string;
  }

  interface CreateProjectData {
    name: string;
    admin_id: number | undefined;
    description: string;
    client_company_id: number;
    deadline: string;
    status?: string;
  }

  interface UpdateProjectData {
    name: string;
    description: string;
    client_company_id: number;
    deadline: string;
    status: string;
  }

  interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
    loading: boolean;
    error: string | null;
  }

  const initialState: ProjectState = {
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
  };

  // ==================== PROJECT THUNKS ====================

  // Fetch all projects
  export const fetchProjects = createAsyncThunk(
    'projects/fetchProjects',
    async (_, { rejectWithValue }) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch projects');
        }

        return await response.json();
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch projects');
      }
    }
  );

  // Fetch project by ID
  export const fetchProjectById = createAsyncThunk(
    'projects/fetchProjectById',
    async (projectId: number, { rejectWithValue }) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch project');
        }

        return await response.json();
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch project');
      }
    }
  );

  // Create new project
  export const createProject = createAsyncThunk(
    'projects/createProject',
    async (projectData: CreateProjectData, { rejectWithValue }) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/projects', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create project');
        }

        return await response.json();
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to create project');
      }
    }
  );

  // Update project
  export const updateProject = createAsyncThunk(
    'projects/updateProject',
    async ({ projectId, projectData }: { projectId: number; projectData: UpdateProjectData }, { rejectWithValue }) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update project');
        }

        return await response.json();
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to update project');
      }
    }
  );

  // Delete project
  export const deleteProject = createAsyncThunk(
    'projects/deleteProject',
    async (projectId: number, { rejectWithValue }) => {
      try {
        const token = localStorage.getItem('token');
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

        return { projectId, message: 'Project deleted successfully' };
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete project');
      }
    }
  );

  // Update project status
  export const updateProjectStatus = createAsyncThunk(
    'projects/updateProjectStatus',
    async ({ projectId, status }: { projectId: number; status: string }, { rejectWithValue }) => {
      try {
        const token = localStorage.getItem('token');
        
        // First get the current project data
        const projectResponse = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!projectResponse.ok) {
          const errorData = await projectResponse.json();
          throw new Error(errorData.error || 'Failed to fetch project data');
        }

        const currentProject = await projectResponse.json();

        // Then update with new status
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...currentProject,
            status: status,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update project status');
        }

        return await response.json();
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to update project status');
      }
    }
  );

  // ==================== PROJECT SLICE ====================

  const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
      clearError: (state) => {
        state.error = null;
      },
      clearCurrentProject: (state) => {
        state.currentProject = null;
      },
      updateProjectLocal: (state, action) => {
        const updatedProject = action.payload;
        const index = state.projects.findIndex(project => project.id === updatedProject.id);
        if (index !== -1) {
          state.projects[index] = { ...state.projects[index], ...updatedProject };
        }
        if (state.currentProject && state.currentProject.id === updatedProject.id) {
          state.currentProject = { ...state.currentProject, ...updatedProject };
        }
      },
    },
    extraReducers: (builder) => {
      builder
        // Fetch Projects
        .addCase(fetchProjects.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchProjects.fulfilled, (state, action) => {
          state.loading = false;
          state.projects = action.payload;
          state.error = null;
        })
        .addCase(fetchProjects.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        // Fetch Project By ID
        .addCase(fetchProjectById.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchProjectById.fulfilled, (state, action) => {
          state.loading = false;
          state.currentProject = action.payload;
          state.error = null;
        })
        .addCase(fetchProjectById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        // Create Project
        .addCase(createProject.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createProject.fulfilled, (state, action) => {
          state.loading = false;
          state.projects.unshift(action.payload);
          state.error = null;
        })
        .addCase(createProject.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        // Update Project
        .addCase(updateProject.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updateProject.fulfilled, (state, action) => {
          state.loading = false;
          const updatedProject = action.payload;
          const index = state.projects.findIndex(project => project.id === updatedProject.id);
          if (index !== -1) {
            state.projects[index] = updatedProject;
          }
          if (state.currentProject && state.currentProject.id === updatedProject.id) {
            state.currentProject = updatedProject;
          }
          state.error = null;
        })
        .addCase(updateProject.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        // Delete Project
        .addCase(deleteProject.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deleteProject.fulfilled, (state, action) => {
          state.loading = false;
          state.projects = state.projects.filter(project => project.id !== action.payload.projectId);
          if (state.currentProject && state.currentProject.id === action.payload.projectId) {
            state.currentProject = null;
          }
          state.error = null;
        })
        .addCase(deleteProject.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        // Update Project Status
        .addCase(updateProjectStatus.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updateProjectStatus.fulfilled, (state, action) => {
          state.loading = false;
          const updatedProject = action.payload;
          const index = state.projects.findIndex(project => project.id === updatedProject.id);
          if (index !== -1) {
            state.projects[index] = updatedProject;
          }
          if (state.currentProject && state.currentProject.id === updatedProject.id) {
            state.currentProject = updatedProject;
          }
          state.error = null;
        })
        .addCase(updateProjectStatus.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
    },
  });

  export const { clearError, clearCurrentProject, updateProjectLocal } = projectSlice.actions;
  export default projectSlice.reducer;