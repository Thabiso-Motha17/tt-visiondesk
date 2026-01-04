import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

// Types
export interface ProjectRating {
  id: number;
  project_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  would_recommend?: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_role?: string;
}

export interface TaskRating {
  id: number;
  task_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  rating_type: 'quality' | 'communication' | 'timeliness' | 'overall';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_role?: string;
}

export interface RatingsDashboard {
  project_ratings: {
    total_ratings: number;
    average_rating: number;
    projects_rated: number;
    unique_raters: number;
  };
  task_ratings: {
    total_ratings: number;
    average_rating: number;
    tasks_rated: number;
    unique_raters: number;
  };
  recent_project_ratings: (ProjectRating & { project_name: string })[];
  recent_task_ratings: (TaskRating & { task_title: string; project_name: string })[];
}

interface ProjectRatingsState {
  [projectId: number]: ProjectRating[];
}

interface TaskRatingsState {
  [taskId: number]: TaskRating[];
}

interface LoadingState {
  project: boolean;
  task: boolean;
  dashboard: boolean;
}

interface ErrorState {
  project: string | null;
  task: string | null;
  dashboard: string | null;
}

interface RatingsState {
  projectRatings: ProjectRatingsState;
  taskRatings: TaskRatingsState;
  dashboard: RatingsDashboard;
  loading: LoadingState;
  error: ErrorState;
}

// Initial state
const initialState: RatingsState = {
  projectRatings: {},
  taskRatings: {},
  dashboard: {
    project_ratings: {
      total_ratings: 0,
      average_rating: 0,
      projects_rated: 0,
      unique_raters: 0,
    },
    task_ratings: {
      total_ratings: 0,
      average_rating: 0,
      tasks_rated: 0,
      unique_raters: 0,
    },
    recent_project_ratings: [],
    recent_task_ratings: [],
  },
  loading: {
    project: false,
    task: false,
    dashboard: false,
  },
  error: {
    project: null,
    task: null,
    dashboard: null,
  },
};

// Async thunks for project ratings
export const fetchProjectRatings = createAsyncThunk<
  { projectId: number; ratings: ProjectRating[] },
  number,
  { rejectValue: string }
>(
  'ratings/fetchProjectRatings',
  async (projectId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project ratings');
      }

      const data = await response.json();
      return { projectId, ratings: data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addProjectRating = createAsyncThunk<
  { projectId: number; rating: ProjectRating },
  { projectId: number; ratingData: Omit<ProjectRating, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at' | 'user_name' | 'user_role'> },
  { rejectValue: string }
>(
  'ratings/addProjectRating',
  async ({ projectId, ratingData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
      });

      if (!response.ok) {
        throw new Error('Failed to add project rating');
      }

      const data = await response.json();
      return { projectId, rating: data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteProjectRating = createAsyncThunk<
  { projectId: number; ratingId: number },
  { projectId: number; ratingId: number },
  { rejectValue: string }
>(
  'ratings/deleteProjectRating',
  async ({ projectId, ratingId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/ratings/${ratingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project rating');
      }

      return { projectId, ratingId };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunks for task ratings
export const fetchTaskRatings = createAsyncThunk<
  { taskId: number; ratings: TaskRating[] },
  number,
  { rejectValue: string }
>(
  'ratings/fetchTaskRatings',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}/ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch task ratings');
      }

      const data = await response.json();
      return { taskId, ratings: data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addTaskRating = createAsyncThunk<
  { taskId: number; rating: TaskRating },
  { taskId: number; ratingData: Omit<TaskRating, 'id' | 'task_id' | 'user_id' | 'created_at' | 'updated_at' | 'user_name' | 'user_role'> },
  { rejectValue: string }
>(
  'ratings/addTaskRating',
  async ({ taskId, ratingData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
      });

      if (!response.ok) {
        throw new Error('Failed to add task rating');
      }

      const data = await response.json();
      return { taskId, rating: data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteTaskRating = createAsyncThunk<
  { taskId: number; ratingId: number },
  { taskId: number; ratingId: number },
  { rejectValue: string }
>(
  'ratings/deleteTaskRating',
  async ({ taskId, ratingId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}/ratings/${ratingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete task rating');
      }

      return { taskId, ratingId };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk for ratings dashboard
// Add debug in your ratingsSlice
export const fetchRatingsDashboard = createAsyncThunk<
  RatingsDashboard,
  void,
  { rejectValue: string }
>(
  'ratings/fetchRatingsDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      console.log('DEBUG - Token from localStorage:', token);
      
      const response = await fetch('/api/ratings/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('DEBUG - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('DEBUG - Error response:', errorText);
        throw new Error(`Failed to fetch ratings dashboard: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('DEBUG - Response data:', data);
      return data;
    } catch (error) {
      console.log('DEBUG - Catch error:', error);
      return rejectWithValue((error as Error).message);
    }
  }
);

const ratingsSlice = createSlice({
  name: 'ratings',
  initialState,
  reducers: {
    clearProjectRatings: (state, action: PayloadAction<number | undefined>) => {
      const projectId = action.payload;
      if (projectId) {
        delete state.projectRatings[projectId];
      } else {
        state.projectRatings = {};
      }
    },
    clearTaskRatings: (state, action: PayloadAction<number | undefined>) => {
      const taskId = action.payload;
      if (taskId) {
        delete state.taskRatings[taskId];
      } else {
        state.taskRatings = {};
      }
    },
    clearRatingsError: (state, action: PayloadAction<keyof ErrorState | undefined>) => {
      const type = action.payload;
      if (type) {
        state.error[type] = null;
      } else {
        state.error = { project: null, task: null, dashboard: null };
      }
    },
    clearAllRatings: (state) => {
      state.projectRatings = {};
      state.taskRatings = {};
      state.dashboard = {
        project_ratings: {
          total_ratings: 0,
          average_rating: 0,
          projects_rated: 0,
          unique_raters: 0,
        },
        task_ratings: {
          total_ratings: 0,
          average_rating: 0,
          tasks_rated: 0,
          unique_raters: 0,
        },
        recent_project_ratings: [],
        recent_task_ratings: [],
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Project Ratings
      .addCase(fetchProjectRatings.pending, (state) => {
        state.loading.project = true;
        state.error.project = null;
      })
      .addCase(fetchProjectRatings.fulfilled, (state, action) => {
        state.loading.project = false;
        const { projectId, ratings } = action.payload;
        state.projectRatings[projectId] = ratings;
      })
      .addCase(fetchProjectRatings.rejected, (state, action) => {
        state.loading.project = false;
        state.error.project = action.payload || 'Failed to fetch project ratings';
      })
      .addCase(addProjectRating.pending, (state) => {
        state.loading.project = true;
        state.error.project = null;
      })
      .addCase(addProjectRating.fulfilled, (state, action) => {
        state.loading.project = false;
        const { projectId, rating } = action.payload;
        
        if (!state.projectRatings[projectId]) {
          state.projectRatings[projectId] = [];
        }
        
        const existingIndex = state.projectRatings[projectId].findIndex(
          r => r.id === rating.id
        );
        
        if (existingIndex >= 0) {
          state.projectRatings[projectId][existingIndex] = rating;
        } else {
          state.projectRatings[projectId].push(rating);
        }
      })
      .addCase(addProjectRating.rejected, (state, action) => {
        state.loading.project = false;
        state.error.project = action.payload || 'Failed to add project rating';
      })
      .addCase(deleteProjectRating.fulfilled, (state, action) => {
        const { projectId, ratingId } = action.payload;
        
        if (state.projectRatings[projectId]) {
          state.projectRatings[projectId] = state.projectRatings[projectId].filter(
            rating => rating.id !== ratingId
          );
        }
      })
      // Task Ratings
      .addCase(fetchTaskRatings.pending, (state) => {
        state.loading.task = true;
        state.error.task = null;
      })
      .addCase(fetchTaskRatings.fulfilled, (state, action) => {
        state.loading.task = false;
        const { taskId, ratings } = action.payload;
        state.taskRatings[taskId] = ratings;
      })
      .addCase(fetchTaskRatings.rejected, (state, action) => {
        state.loading.task = false;
        state.error.task = action.payload || 'Failed to fetch task ratings';
      })
      .addCase(addTaskRating.pending, (state) => {
        state.loading.task = true;
        state.error.task = null;
      })
      .addCase(addTaskRating.fulfilled, (state, action) => {
        state.loading.task = false;
        const { taskId, rating } = action.payload;
        
        if (!state.taskRatings[taskId]) {
          state.taskRatings[taskId] = [];
        }
        
        const existingIndex = state.taskRatings[taskId].findIndex(
          r => r.id === rating.id && r.rating_type === rating.rating_type
        );
        
        if (existingIndex >= 0) {
          state.taskRatings[taskId][existingIndex] = rating;
        } else {
          state.taskRatings[taskId].push(rating);
        }
      })
      .addCase(addTaskRating.rejected, (state, action) => {
        state.loading.task = false;
        state.error.task = action.payload || 'Failed to add task rating';
      })
      .addCase(deleteTaskRating.fulfilled, (state, action) => {
        const { taskId, ratingId } = action.payload;
        
        if (state.taskRatings[taskId]) {
          state.taskRatings[taskId] = state.taskRatings[taskId].filter(
            rating => rating.id !== ratingId
          );
        }
      })
      // Dashboard
      .addCase(fetchRatingsDashboard.pending, (state) => {
        state.loading.dashboard = true;
        state.error.dashboard = null;
      })
      .addCase(fetchRatingsDashboard.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchRatingsDashboard.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.error.dashboard = action.payload || 'Failed to fetch ratings dashboard';
      });
  },
});

export const {
  clearProjectRatings,
  clearTaskRatings,
  clearRatingsError,
  clearAllRatings,
} = ratingsSlice.actions;

// Selectors
export const selectProjectRatings = (state: { ratings: RatingsState }, projectId: number): ProjectRating[] => 
  state.ratings.projectRatings[projectId] || [];

export const selectTaskRatings = (state: { ratings: RatingsState }, taskId: number): TaskRating[] => 
  state.ratings.taskRatings[taskId] || [];

export const selectRatingsDashboard = (state: { ratings: RatingsState }): RatingsDashboard => 
  state.ratings.dashboard;

export const selectProjectAverageRating = (state: { ratings: RatingsState }, projectId: number): number => {
  const ratings = state.ratings.projectRatings[projectId] || [];
  if (ratings.length === 0) return 0;
  
  const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
  return sum / ratings.length;
};

export const selectTaskAverageRating = (state: { ratings: RatingsState }, taskId: number): number => {
  const ratings = state.ratings.taskRatings[taskId] || [];
  if (ratings.length === 0) return 0;
  
  const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
  return sum / ratings.length;
};

export const selectTaskRatingByType = (
  state: { ratings: RatingsState }, 
  taskId: number, 
  ratingType: TaskRating['rating_type']
): TaskRating | undefined => {
  const ratings = state.ratings.taskRatings[taskId] || [];
  return ratings.find(rating => rating.rating_type === ratingType);
};

export const selectUserProjectRating = (
  state: { ratings: RatingsState }, 
  projectId: number, 
  userId: number
): ProjectRating | undefined => {
  const ratings = state.ratings.projectRatings[projectId] || [];
  return ratings.find(rating => rating.user_id === userId);
};

export const selectUserTaskRating = (
  state: { ratings: RatingsState }, 
  taskId: number, 
  userId: number, 
  ratingType: TaskRating['rating_type'] = 'quality'
): TaskRating | undefined => {
  const ratings = state.ratings.taskRatings[taskId] || [];
  return ratings.find(rating => 
    rating.user_id === userId && rating.rating_type === ratingType
  );
};

export const selectRatingsLoading = (state: { ratings: RatingsState }): LoadingState => 
  state.ratings.loading;

export const selectRatingsError = (state: { ratings: RatingsState }): ErrorState => 
  state.ratings.error;

export default ratingsSlice.reducer;