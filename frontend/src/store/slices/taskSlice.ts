import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { API_URL } from '../../../api';

// ==================== TYPE DEFINITIONS ====================

export interface Comment {
  id: number;
  content: string;
  author: string;
  authorId: number;
  timestamp: string;
  isCollaboration?: boolean;  
}

export interface Deliverable {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  note?: string;
  uploadedBy: number;
  uploadedByName: string;
  timestamp: string;
}

export interface Clarification {
  id: number;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string;
  requestedById: number;
  timestamp: string;
  status: 'pending' | 'answered' | 'resolved';
  response?: string;
  respondedBy?: string;
  respondedById?: number;
  responseTimestamp?: string;
}

export interface SubTask {
  id: number;
  task_id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  approved: boolean;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'review';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number;
  assigned_to: number;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  progress_percentage: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  assigned_name?: string;
  project_name?: string;
  comments?: Comment[];
  deliverables?: Deliverable[];
  clarifications?: Clarification[];
  sub_tasks?: SubTask[];
}

export interface CreateTaskData {
  title: string;
  description: string;
  project_id: number;
  assigned_to: number;
  priority: TaskPriority;
  deadline: string;
  status?: TaskStatus;
  progress_percentage?: number;
}

export interface UpdateTaskData {
  title: string;
  description: string;
  assigned_to: number;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  progress_percentage: number;
}

export interface CreateSubTaskData {
  title: string;
  description: string;
}

export interface UpdateSubTaskData {
  title?: string;
  description?: string;
  status?: SubTask['status'];
  approved?: boolean;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
}

// ==================== STATE INITIALIZATION ====================

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
};

// ==================== ASYNC THUNKS ====================

// Fetch all tasks
export const fetchTasks = createAsyncThunk<
  Task[], // Return type
  void, // Args type
  { rejectValue: string } // Reject value type
>(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const data: Task[] = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch tasks');
    }
  }
);

// Fetch task by ID
export const fetchTaskById = createAsyncThunk<
  Task,
  number,
  { rejectValue: string }
>(
  'tasks/fetchTaskById',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch task');
      }

      const data: Task = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch task');
    }
  }
);

// Create new task
export const createTask = createAsyncThunk<
  Task,
  CreateTaskData,
  { rejectValue: string }
>(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const data: Task = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create task');
    }
  }
);

// Update task
export const updateTask = createAsyncThunk<
  Task,
  { taskId: number; taskData: UpdateTaskData },
  { rejectValue: string }
>(
  'tasks/updateTask',
  async ({ taskId, taskData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const data: Task = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update task');
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk<
  { taskId: number; message: string },
  number,
  { rejectValue: string }
>(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      const data: { message: string } = await response.json();
      return { taskId, message: data.message };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete task');
    }
  }
);

// Update task status and progress
export const updateTaskStatus = createAsyncThunk<
  Task,
  {
    taskId: number;
    status: TaskStatus;
    progress_percentage: number;
    notes?: string;
  },
  { rejectValue: string }
>(
  'tasks/updateTaskStatus',
  async ({ taskId, status, progress_percentage }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      // First get the current task data
      const taskResponse = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!taskResponse.ok) {
        const errorData = await taskResponse.json();
        throw new Error(errorData.error || 'Failed to fetch task data');
      }

      const currentTask: Task = await taskResponse.json();

      // Then update with new status and progress
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentTask,
          status,
          progress_percentage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task status');
      }

      const data: Task = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update task status');
    }
  }
);

// ==================== SUB-TASK THUNKS ====================

// Fetch sub-tasks for a task
export const fetchSubTasks = createAsyncThunk<
  { taskId: number; subTasks: SubTask[] },
  number,
  { rejectValue: string }
>(
  'tasks/fetchSubTasks',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/subtasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sub-tasks');
      }

      const subTasks: SubTask[] = await response.json();
      return { taskId, subTasks };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch sub-tasks');
    }
  }
);

// Create sub-task
export const createSubTask = createAsyncThunk<
  { taskId: number; subTask: SubTask },
  { taskId: number; title: string; description: string },
  { rejectValue: string }
>(
  'tasks/createSubTask',
  async ({ taskId, title, description }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create sub-task');
      }

      const subTask: SubTask = await response.json();
      return { taskId, subTask };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create sub-task');
    }
  }
);

// Update sub-task
export const updateSubTask = createAsyncThunk<
  SubTask,
  {
    subTaskId: number;
    title?: string;
    description?: string;
    status?: SubTask['status'];
    approved?: boolean;
  },
  { rejectValue: string }
>(
  'tasks/updateSubTask',
  async ({ subTaskId, ...updateData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/subtasks/${subTaskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sub-task');
      }

      const data: SubTask = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update sub-task');
    }
  }
);

// Delete sub-task
export const deleteSubTask = createAsyncThunk<
  { subTaskId: number; message: string },
  number,
  { rejectValue: string }
>(
  'tasks/deleteSubTask',
  async (subTaskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/subtasks/${subTaskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete sub-task');
      }

      const data: { message: string } = await response.json();
      return { subTaskId, message: data.message };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete sub-task');
    }
  }
);

// ==================== TASK SLICE ====================

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    // Sync action for optimistic updates
    updateTaskProgress: (state, action: PayloadAction<{ taskId: number; progress: number }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.progress_percentage = action.payload.progress;
      }
      if (state.currentTask && state.currentTask.id === action.payload.taskId) {
        state.currentTask.progress_percentage = action.payload.progress;
      }
    },
    updateTaskStatusLocal: (state, action: PayloadAction<{ taskId: number; status: TaskStatus }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
      }
      if (state.currentTask && state.currentTask.id === action.payload.taskId) {
        state.currentTask.status = action.payload.status;
      }
    },
    addCommentToTask: (state, action: PayloadAction<{ taskId: number; comment: Comment }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        if (!task.comments) {
          task.comments = [];
        }
        task.comments.push(action.payload.comment);
      }
      if (state.currentTask && state.currentTask.id === action.payload.taskId) {
        if (!state.currentTask.comments) {
          state.currentTask.comments = [];
        }
        state.currentTask.comments.push(action.payload.comment);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = false;
        state.tasks = action.payload;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Task By ID
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false;
        state.currentTask = action.payload;
        state.error = null;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false;
        state.tasks.unshift(action.payload);
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Task
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false;
        const updatedTask = action.payload;
        const index = state.tasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
          state.tasks[index] = updatedTask;
        }
        if (state.currentTask && state.currentTask.id === updatedTask.id) {
          state.currentTask = updatedTask;
        }
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Task
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<{ taskId: number; message: string }>) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload.taskId);
        if (state.currentTask && state.currentTask.id === action.payload.taskId) {
          state.currentTask = null;
        }
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Task Status
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false;
        const updatedTask = action.payload;
        const index = state.tasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
          state.tasks[index] = updatedTask;
        }
        if (state.currentTask && state.currentTask.id === updatedTask.id) {
          state.currentTask = updatedTask;
        }
        state.error = null;
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Sub-Tasks
      .addCase(fetchSubTasks.fulfilled, (state, action: PayloadAction<{ taskId: number; subTasks: SubTask[] }>) => {
        const { taskId, subTasks } = action.payload;
        if (state.currentTask && state.currentTask.id === taskId) {
          state.currentTask.sub_tasks = subTasks;
        }
      })
      // Create Sub-Task
      .addCase(createSubTask.fulfilled, (state, action: PayloadAction<{ taskId: number; subTask: SubTask }>) => {
        const { taskId, subTask } = action.payload;
        if (state.currentTask && state.currentTask.id === taskId) {
          if (!state.currentTask.sub_tasks) {
            state.currentTask.sub_tasks = [];
          }
          state.currentTask.sub_tasks.push(subTask);
        }
      })
      // Update Sub-Task
      .addCase(updateSubTask.fulfilled, (state, action: PayloadAction<SubTask>) => {
        const updatedSubTask = action.payload;
        if (state.currentTask && state.currentTask.sub_tasks) {
          const index = state.currentTask.sub_tasks.findIndex(st => st.id === updatedSubTask.id);
          if (index !== -1) {
            state.currentTask.sub_tasks[index] = updatedSubTask;
          }
        }
      })
      // Delete Sub-Task
      .addCase(deleteSubTask.fulfilled, (state, action: PayloadAction<{ subTaskId: number; message: string }>) => {
        const { subTaskId } = action.payload;
        if (state.currentTask && state.currentTask.sub_tasks) {
          state.currentTask.sub_tasks = state.currentTask.sub_tasks.filter(st => st.id !== subTaskId);
        }
      });
  },
});

export const { 
  clearError, 
  clearCurrentTask, 
  updateTaskProgress, 
  updateTaskStatusLocal,
  addCommentToTask
} = taskSlice.actions;
export default taskSlice.reducer;
