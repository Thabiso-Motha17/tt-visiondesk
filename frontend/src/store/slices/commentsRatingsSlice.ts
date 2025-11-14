// commentsRatingsSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type{
  Comment,
  Rating,
  CommentsRatingsState,
  FetchCommentsParams,
  AddCommentParams,
  UpdateCommentParams,
  FetchRatingsParams,
  AddOrUpdateRatingParams,
  AverageRatingParams
} from '../../types/type';

// Async Thunks for Comments
export const fetchComments = createAsyncThunk<
  Comment[],
  FetchCommentsParams,
  { rejectValue: string }
>(
  'commentsRatings/fetchComments',
  async ({ projectId, taskId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (projectId) queryParams.append('project_id', projectId.toString());
      if (taskId) queryParams.append('task_id', taskId.toString());

      const response = await fetch(`/api/comments?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addComment = createAsyncThunk<
  Comment,
  AddCommentParams,
  { rejectValue: string }
>(
  'commentsRatings/addComment',
  async ({ content, projectId, taskId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          project_id: projectId, 
          task_id: taskId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateComment = createAsyncThunk<
  Comment,
  UpdateCommentParams,
  { rejectValue: string }
>(
  'commentsRatings/updateComment',
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteComment = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'commentsRatings/deleteComment',
  async (commentId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      return commentId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async Thunks for Ratings
export const fetchRatings = createAsyncThunk<
  Rating[],
  FetchRatingsParams,
  { rejectValue: string }
>(
  'commentsRatings/fetchRatings',
  async ({ projectId, taskId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (projectId) queryParams.append('project_id', projectId.toString());
      if (taskId) queryParams.append('task_id', taskId.toString());

      const response = await fetch(`/api/ratings?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ratings');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchAverageRating = createAsyncThunk<
  AverageRatingParams,
  FetchRatingsParams,
  { rejectValue: string }
>(
  'commentsRatings/fetchAverageRating',
  async ({ projectId, taskId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (projectId) queryParams.append('project_id', projectId.toString());
      if (taskId) queryParams.append('task_id', taskId.toString());

      const response = await fetch(`/api/ratings/average?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch average rating');
      }

      const data = await response.json();
      return { 
        projectId, 
        taskId, 
        average_rating: data.average_rating, 
        total_ratings: data.total_ratings 
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addOrUpdateRating = createAsyncThunk<
  Rating,
  AddOrUpdateRatingParams,
  { rejectValue: string }
>(
  'commentsRatings/addOrUpdateRating',
  async ({ rating, comment, projectId, taskId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          rating, 
          comment, 
          project_id: projectId, 
          task_id: taskId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add/update rating');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteRating = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'commentsRatings/deleteRating',
  async (ratingId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete rating');
      }

      return ratingId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Initial State
const initialState: CommentsRatingsState = {
  // Comments
  comments: [],
  commentsLoading: false,
  commentsError: null,
  
  // Ratings
  ratings: [],
  averageRatings: {},
  ratingsLoading: false,
  ratingsError: null,
  
  // Current operations
  addCommentLoading: false,
  addRatingLoading: false,
};

// Slice
const commentsRatingsSlice = createSlice({
  name: 'commentsRatings',
  initialState,
  reducers: {
    clearComments: (state) => {
      state.comments = [];
      state.commentsError = null;
    },
    clearRatings: (state) => {
      state.ratings = [];
      state.ratingsError = null;
    },
    clearErrors: (state) => {
      state.commentsError = null;
      state.ratingsError = null;
    },
    resetCommentsRatings: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Comments
      .addCase(fetchComments.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(fetchComments.fulfilled, (state, action: PayloadAction<Comment[]>) => {
        state.commentsLoading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.commentsLoading = false;
        state.commentsError = action.payload || 'Failed to fetch comments';
      })
      
      .addCase(addComment.pending, (state) => {
        state.addCommentLoading = true;
        state.commentsError = null;
      })
      .addCase(addComment.fulfilled, (state, action: PayloadAction<Comment>) => {
        state.addCommentLoading = false;
        state.comments.unshift(action.payload);
      })
      .addCase(addComment.rejected, (state, action) => {
        state.addCommentLoading = false;
        state.commentsError = action.payload || 'Failed to add comment';
      })
      
      .addCase(updateComment.fulfilled, (state, action: PayloadAction<Comment>) => {
        const updatedComment = action.payload;
        const index = state.comments.findIndex(comment => comment.id === updatedComment.id);
        if (index !== -1) {
          state.comments[index] = updatedComment;
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.commentsError = action.payload || 'Failed to update comment';
      })
      
      .addCase(deleteComment.fulfilled, (state, action: PayloadAction<number>) => {
        const commentId = action.payload;
        state.comments = state.comments.filter(comment => comment.id !== commentId);
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.commentsError = action.payload || 'Failed to delete comment';
      })
      
      // Ratings
      .addCase(fetchRatings.pending, (state) => {
        state.ratingsLoading = true;
        state.ratingsError = null;
      })
      .addCase(fetchRatings.fulfilled, (state, action: PayloadAction<Rating[]>) => {
        state.ratingsLoading = false;
        state.ratings = action.payload;
      })
      .addCase(fetchRatings.rejected, (state, action) => {
        state.ratingsLoading = false;
        state.ratingsError = action.payload || 'Failed to fetch ratings';
      })
      
      .addCase(fetchAverageRating.fulfilled, (state, action: PayloadAction<AverageRatingParams>) => {
        const { projectId, taskId, average_rating, total_ratings } = action.payload;
        const key = projectId ? `project_${projectId}` : `task_${taskId}`;
        state.averageRatings[key] = { average_rating, total_ratings };
      })
      
      .addCase(addOrUpdateRating.pending, (state) => {
        state.addRatingLoading = true;
        state.ratingsError = null;
      })
      .addCase(addOrUpdateRating.fulfilled, (state, action: PayloadAction<Rating>) => {
        state.addRatingLoading = false;
        const updatedRating = action.payload;
        
        const existingIndex = state.ratings.findIndex(rating => rating.id === updatedRating.id);
        if (existingIndex !== -1) {
          state.ratings[existingIndex] = updatedRating;
        } else {
          state.ratings.push(updatedRating);
        }
      })
      .addCase(addOrUpdateRating.rejected, (state, action) => {
        state.addRatingLoading = false;
        state.ratingsError = action.payload || 'Failed to add/update rating';
      })
      
      .addCase(deleteRating.fulfilled, (state, action: PayloadAction<number>) => {
        const ratingId = action.payload;
        state.ratings = state.ratings.filter(rating => rating.id !== ratingId);
      })
      .addCase(deleteRating.rejected, (state, action) => {
        state.ratingsError = action.payload || 'Failed to delete rating';
      });
  },
});

// Export actions and reducer
export const { 
  clearComments, 
  clearRatings, 
  clearErrors, 
  resetCommentsRatings 
} = commentsRatingsSlice.actions;

export default commentsRatingsSlice.reducer;